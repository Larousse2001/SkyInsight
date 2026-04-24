#!/usr/bin/env python3
"""
Split raw classification datasets into train/val/test folders (70/15/15).
Handles cabin_cleanliness, crowd, and luggage datasets.
"""

import os
import shutil
import random
from pathlib import Path
from collections import defaultdict

random.seed(42)

def split_dataset(raw_dir, output_base_dir, class_names, split_ratio=(0.7, 0.15, 0.15)):
    """
    Split images from raw folder into train/val/test subfolders per class.
    
    Args:
        raw_dir: Path to raw folder containing class subfolders
        output_base_dir: Base output directory (train/val/test will be created here)
        class_names: List of class folder names to process
        split_ratio: Tuple of (train, val, test) ratios (default: 70%, 15%, 15%)
    """
    
    assert abs(sum(split_ratio) - 1.0) < 0.001, f"Split ratios must sum to 1.0, got {split_ratio}"
    
    train_ratio, val_ratio, test_ratio = split_ratio
    splits = ["train", "val", "test"]
    split_ratios = [train_ratio, val_ratio, test_ratio]
    
    # Rebuild split directories so old classes do not remain behind.
    for split in splits:
        split_dir = os.path.join(output_base_dir, split)
        if os.path.exists(split_dir):
            shutil.rmtree(split_dir)
        for class_name in class_names:
            os.makedirs(os.path.join(split_dir, class_name), exist_ok=True)
    
    # Process each class
    total_images = 0
    stats = defaultdict(lambda: defaultdict(int))
    
    for class_name in class_names:
        class_raw_dir = os.path.join(raw_dir, class_name)
        
        if not os.path.exists(class_raw_dir):
            print(f"⚠️  Warning: Class folder not found: {class_raw_dir}")
            continue
        
        # Get all image files
        image_files = [f for f in os.listdir(class_raw_dir) 
                      if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp'))]
        
        if not image_files:
            print(f"⚠️  Warning: No images found in {class_raw_dir}")
            continue
        
        # Shuffle
        random.shuffle(image_files)
        
        # Calculate split indices
        total = len(image_files)
        train_count = int(total * train_ratio)
        val_count = int(total * val_ratio)
        
        train_files = image_files[:train_count]
        val_files = image_files[train_count:train_count + val_count]
        test_files = image_files[train_count + val_count:]
        
        # Copy files to respective folders
        split_data = {
            "train": train_files,
            "val": val_files,
            "test": test_files
        }
        
        for split, files in split_data.items():
            split_dir = os.path.join(output_base_dir, split, class_name)
            for file in files:
                src = os.path.join(class_raw_dir, file)
                dst = os.path.join(split_dir, file)
                shutil.copy2(src, dst)
                stats[class_name][split] += 1
        
        total_images += total
        print(f"✅ {class_name}: {total} images → Train: {len(train_files)}, Val: {len(val_files)}, Test: {len(test_files)}")
    
    return stats, total_images

def main():
    dl_root = r"c:\Users\achre\Downloads\Esprit\DL\Ailines project"
    
    print("=" * 70)
    print("🔄 SPLITTING DATASETS (70% train / 15% val / 15% test)")
    print("=" * 70)
    
    # Cabin Cleanliness
    print("\n📁 Cabin Cleanliness:")
    cabin_raw = os.path.join(dl_root, "08_CNN/data/cabin_cleanliness/raw")
    cabin_output = os.path.join(dl_root, "08_CNN/data/cabin_cleanliness")
    cabin_classes = ["Clean", "Dirty"]
    split_dataset(cabin_raw, cabin_output, cabin_classes)
    
    # Crowd Analytics
    print("\n📁 Crowd Analytics:")
    crowd_raw = os.path.join(dl_root, "08_CNN/data/crowd/raw")
    crowd_output = os.path.join(dl_root, "08_CNN/data/crowd")
    crowd_classes = ["low_crowd", "high_crowd"]
    split_dataset(crowd_raw, crowd_output, crowd_classes)
    
    # Luggage / Baggage QC
    print("\n📁 Baggage QC (Luggage):")
    luggage_raw = os.path.join(dl_root, "08_CNN/data/luggage/raw")
    luggage_output = os.path.join(dl_root, "08_CNN/data/luggage")
    luggage_classes = ["damaged_luggage", "good_luggage"]
    split_dataset(luggage_raw, luggage_output, luggage_classes)
    
    print("\n" + "=" * 70)
    print("✅ Dataset splitting complete! Ready for training.")
    print("=" * 70)

if __name__ == "__main__":
    main()
