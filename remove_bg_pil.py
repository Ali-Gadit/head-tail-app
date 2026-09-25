from PIL import Image

img = Image.open('Reference images/codeverse_logo.jpeg').convert("RGBA")
datas = img.getdata()

new_data = []
for item in datas:
    # change all white (also shades of white)
    # to transparent
    if item[0] > 220 and item[1] > 220 and item[2] > 220:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

img.putdata(new_data)
img.save("assets/codeverse_logo_transparent.png", "PNG")
