# Consent Guardian Icons

## PNG Icons generieren

Browser-Extensions benötigen PNG-Icons in verschiedenen Größen.
Konvertiere `icon.svg` in die folgenden Größen:

- icon-16.png (16x16)
- icon-32.png (32x32)
- icon-48.png (48x48)
- icon-128.png (128x128)

### Konvertierung mit ImageMagick:

```bash
convert -background none icon.svg -resize 16x16 icon-16.png
convert -background none icon.svg -resize 32x32 icon-32.png
convert -background none icon.svg -resize 48x48 icon-48.png
convert -background none icon.svg -resize 128x128 icon-128.png
```

### Konvertierung mit rsvg-convert:

```bash
rsvg-convert -w 16 -h 16 icon.svg -o icon-16.png
rsvg-convert -w 32 -h 32 icon.svg -o icon-32.png
rsvg-convert -w 48 -h 48 icon.svg -o icon-48.png
rsvg-convert -w 128 -h 128 icon.svg -o icon-128.png
```

### Online Tools:

- https://cloudconvert.com/svg-to-png
- https://svgtopng.com/
