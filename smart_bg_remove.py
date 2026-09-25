from PIL import Image

img = Image.open('Reference images/codeverse_logo.jpeg').convert("RGBA")
datas = img.getdata()

new_data = []
for item in datas:
    # Calculate luminance
    Y = int(0.299 * item[0] + 0.587 * item[1] + 0.114 * item[2])
    
    if Y > 245:
        new_data.append((item[0], item[1], item[2], 0))
    elif Y < 180:
        new_data.append((item[0], item[1], item[2], 255))
    else:
        # Smooth anti-aliased alpha transition for edges
        alpha = int(255 * (245 - Y) / (245 - 180))
        new_data.append((item[0], item[1], item[2], alpha))

img.putdata(new_data)
img.save("assets/codeverse_logo_transparent.png", "PNG")
