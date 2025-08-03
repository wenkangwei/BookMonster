#!/bin/bash

# 进入目标目录
cd ../data/character/images/

# 批量转换所有PNG
for png_file in *.png; do
  temp_bmp="${png_file%.png}.bmp"
  svg_file="${png_file%.png}.svg"
  
  convert "$png_file" BMP3:"$temp_bmp" && \
  potrace -s -o "$svg_file" "$temp_bmp" && \
  rm "$temp_bmp"
done