from rembg import remove
from PIL import Image

input_path = r"C:\MyGames\head-tail-app\Reference images\codeverse_logo.jpeg"
output_path = r"C:\MyGames\head-tail-app\assets\codeverse_logo_transparent.png"

input_image = Image.open(input_path)
output_image = remove(input_image)
output_image.save(output_path)
