(function() {
  var canvas, canvasContext, img;

  canvas = document.getElementById('canvas');

  canvasContext = canvas.getContext('2d');

  img = new Image;

  img.src = 'test.jpg';

  img.onload = function() {
    var data, jtImage, newData;
    canvas.width = img.width;
    canvas.height = img.height;
    canvasContext.drawImage(img, 0, 0, img.width, img.height);
    data = canvasContext.getImageData(0, 0, img.width, img.height);
    jtImage = new JTImage(data);
    jtImage.removeBackground();
    newData = jtImage.getData();
    return canvasContext.putImageData(newData, 0, 0);
  };

}).call(this);
