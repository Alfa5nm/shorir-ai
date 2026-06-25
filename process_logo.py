import sys
from PIL import Image
from rembg import remove

def process_image(input_path, output_path):
    print("Opening image...")
    img = Image.open(input_path).convert("RGBA")
    
    print("Removing background with rembg...")
    img_nobg = remove(img)
    
    width, height = img_nobg.size
    print(f"Original size: {width}x{height}")
    
    # The logo is in the center, text is at the bottom.
    # We will crop the bottom 25% of the image to ensure the text is removed.
    # 75% of height is kept.
    crop_height = int(height * 0.75)
    crop_box = (0, 0, width, crop_height)
    print(f"Cropping to {crop_box}")
    cropped_img = img_nobg.crop(crop_box)
    
    # Now, find the bounding box of the remaining non-transparent pixels to tightly crop
    bbox = cropped_img.getbbox()
    if bbox:
        print(f"Tight cropping to bounding box: {bbox}")
        cropped_img = cropped_img.crop(bbox)
    
    print(f"Saving to {output_path}")
    cropped_img.save(output_path, "PNG")
    print("Done!")

if __name__ == "__main__":
    process_image('apps/web/public/images/logo.png', 'apps/web/public/images/logo_nobg.png')
