from PIL import Image

# Open the image
img = Image.open('assets/cv_logo.png')
width, height = img.size

# We want to crop it to a perfect square in the center (height x height)
# Or maybe just crop off the right 20%? The user said "crop the sides"
# A square is usually the best bet for a logo to remove side text/stars.
# Let's crop it to a square!
new_width = height
left = (width - new_width) / 2
top = 0
right = (width + new_width) / 2
bottom = height

# Crop the image
img_cropped = img.crop((left, top, right, bottom))
img_cropped.save('assets/cv_logo_cropped.png')
