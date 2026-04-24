#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
import json
import tensorflow as tf


def build_model(img_size: int, num_classes: int) -> tf.keras.Model:
    base = tf.keras.applications.MobileNetV2(
        input_shape=(img_size, img_size, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False

    inputs = tf.keras.Input(shape=(img_size, img_size, 3))
    x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
    x = base(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.2)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)

    model = tf.keras.Model(inputs, outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main() -> None:
    parser = argparse.ArgumentParser(description="Train cabin cleanliness CNN classifier.")
    parser.add_argument("--data-root", required=True, type=Path, help="Folder with train/val/test subfolders")
    parser.add_argument("--epochs", default=15, type=int)
    parser.add_argument("--img-size", default=224, type=int)
    parser.add_argument("--batch-size", default=16, type=int)
    parser.add_argument("--output-dir", default=Path("08_CNN/models"), type=Path)
    args = parser.parse_args()

    train_dir = args.data_root / "train"
    val_dir = args.data_root / "val"
    test_dir = args.data_root / "test"

    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        label_mode="int",
        image_size=(args.img_size, args.img_size),
        batch_size=args.batch_size,
        shuffle=True,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        val_dir,
        label_mode="int",
        image_size=(args.img_size, args.img_size),
        batch_size=args.batch_size,
        shuffle=False,
    )
    test_ds = tf.keras.utils.image_dataset_from_directory(
        test_dir,
        label_mode="int",
        image_size=(args.img_size, args.img_size),
        batch_size=args.batch_size,
        shuffle=False,
    )

    class_names = train_ds.class_names
    model = build_model(args.img_size, len(class_names))

    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=4, restore_best_weights=True),
    ]
    history = model.fit(train_ds, validation_data=val_ds, epochs=args.epochs, callbacks=callbacks)

    test_loss, test_acc = model.evaluate(test_ds, verbose=0)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    model_path = args.output_dir / "cabin_cleanliness_mobilenetv2.keras"
    metrics_path = args.output_dir / "cabin_cleanliness_metrics.json"
    classes_path = args.output_dir / "cabin_cleanliness_classes.json"

    model.save(model_path)
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump({"test_loss": float(test_loss), "test_accuracy": float(test_acc)}, f, indent=2)
    with open(classes_path, "w", encoding="utf-8") as f:
        json.dump({"classes": class_names}, f, indent=2)

    print(f"Saved model: {model_path}")
    print(f"Saved metrics: {metrics_path}")
    print(f"Saved classes: {classes_path}")
    print(f"Test accuracy: {test_acc:.4f}")


if __name__ == "__main__":
    main()
