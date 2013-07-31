noop = ->

class Color
  constructor : (data) ->
    @data = data
  color : (type = '', value) ->
    type = type.toLowerCase()
    index = 0
    switch type
      when 'r' then index = 0
      when 'g' then index = 1
      when 'b' then index = 2
      when 'a' then index = 3
      else index = 0
    if value?
      @data[index] = value
      @
    else
      @data[index]
  getData : ->
    # if @canRemove
    #   @data[3] = 0
    @data

class JTImage
  constructor : (data) ->
    console.time 'LOG'
    @originData = data
    @initColorMap data.data, data.width, data.height
    @similarOffset = 3
    # @removeBackground()
    # @getData()
    console.timeEnd 'LOG'
  getData : ->
    originData = @originData
    data = originData.data
    index = 3
    for i in [0...@height]
      for j in [0...@width]
        if !@colorMap[i][j].color 'a'
          data[index] = 0
        index += 4
    originData
  removeBackground : ->

    # getPoints = (x, y, maxX, maxY) ->
    #   arr = []
    #   for i in [x...maxX]
    #     arr.push [i, y]
    #   for i in [y...maxY]
    #     arr.push [maxX - 1, i]
    #   for i in [maxX - 1..x]
    #     arr.push [i, maxY - 1]
    #   for i in [maxY - 1..y]
    #     arr.push [x, i]
    #   arr

    # points = getPoints 0, 0, @width, @height
    # for point in points
    #   @removeJudge point[1], point[0]
    # startX = 0
    # startY = 0
    # maxY = @height
    # minX
    # maxX = @width
    # while

    for i in [0...@height]
      for j in [0...@width]
        @removeJudge j, i
    for i in [@height - 1..0]
      for j in [0...@width]
        @removeJudge j, i
    for i in [0...@height]
      for j in [@width - 1..0]
        @removeJudge j, i
    for i in [@height - 1..0]
      for j in [@width - 1..0]
        @removeJudge j, i
  removeJudge : (x, y)->
    color = @colorMap[y]?[x]
    offsets = [
      [-1, -1]
      [-1, 0]
      [-1, 1]
      [0, -1]
      [0, 1]
      [1, -1]
      [1, 0]
      [1, 1]
    ]
    for i in [0...offsets.length]
      offset = offsets[i]
      tmpX = x + offset[0]
      tmpY = y + offset[1]
      tmpColor = @colorMap[tmpY]?[tmpX]
      if tmpColor?.color('a') == 0 && @isSimilar color, tmpColor
        color.color 'a', 0
        break
  isSimilar : (color1, color2) ->
    if !color1 || !color2
      false
    else
      rOffset = Math.pow color1.color('r') - color2.color('r'), 2
      gOffset = Math.pow color1.color('g') - color2.color('g'), 2
      bOffset = Math.pow color1.color('b') - color2.color('b'), 2
      @similarOffset > Math.sqrt rOffset + gOffset + bOffset

  initColorMap : (data, width, height) ->
    data = Array.prototype.slice.call data
    index = 0
    colorMap = []
    # filterMap = []
    for i in [0...height]
      colors = []
      # filter = []
      for j in [0...width]
        color = new Color data.slice index, index + 4
        index += 4
        if (i == 0 && j < 10) || j == 0 || (i == height - 1 && j < 10) || j == width - 1
          color.color 'a', 0
          # color.canRemove = true
        # else
          # color.canRemove = false
        colors.push color
      colorMap.push colors
      # filterMap.push filter
    @width = width
    @height = height
    # @filterMap = filterMap
    @colorMap = colorMap
if typeof exports != 'undefined'
  module.exports = JTImage
else
  @JTImage = JTImage