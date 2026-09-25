from rembg import remove, new_session
from PIL import Image

input_path = "Reference images/codeverse_logo.jpeg"
output_path = "assets/codeverse_logo_transparent.png"

print("Starting session with u2netp...")
session = new_session("u2netp")
print("Opening image...")
input_image = Image.open(input_path)
print("Removing background...")
output_image = remove(input_image, session=session)
print("Saving image...")
output_image.save(output_path)
print("Done!")
