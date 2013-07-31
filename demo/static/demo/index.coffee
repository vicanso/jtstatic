canvas = document.getElementById 'canvas'
canvasContext = canvas.getContext '2d'
img = new Image
img.src = 'test.jpg'
img.onload = ->
  canvas.width = img.width
  canvas.height = img.height
  canvasContext.drawImage img, 0, 0, img.width, img.height
  data = canvasContext.getImageData 0, 0, img.width, img.height
  jtImage = new JTImage data
  jtImage.removeBackground()
  newData = jtImage.getData()
  canvasContext.putImageData newData, 0, 0
# img.src = 'propic.png';
# img.onload = function(){
#   canvas.width = img.width;
#   canvas.height = img.height;
#   canvasContext.drawImage(img, 0, 0, img.width, img.height);
#   data = canvasContext.getImageData(0, 0, img.width, img.height);
#   console.dir(data);
# };

