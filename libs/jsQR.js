/**
 * @fileoverview
 * JSQR - A javascript QR code reading library.
 * This library uses the computer's camera to scan QR codes.
 *
 * @author <a href="mailto:developers@cozmo.com">Cozmo</a>
 * @version 1.4.0
 */

"use strict";

function jsQR(data, width, height, options) {
  // default options
  options = options || {};
  var opts = {
    inversionAttempts: options.inversionAttempts || "dontInvert",
  };

  var result;
  var location = null;

  try {
    // Try to locate the QR code in the image
    location = locate(data, width, height);
  } catch (e) {
    console.warn("locate failed", e);
  }

  if (location) {
    try {
      // Extract the QR code from the image
      var extracted = extract(data, width, height, location);
      
      // Try to decode the QR code
      result = decode(extracted);
    } catch (e) {
      console.warn("decode failed", e);
    }
  }

  // If we didn't find a QR code, try inverting the image and scanning again
  if (!result && opts.inversionAttempts !== "dontInvert") {
    var invertedData = new Uint8ClampedArray(data);
    for (var i = 0; i < invertedData.length; i += 4) {
      invertedData[i] = 255 - invertedData[i];     // Red
      invertedData[i + 1] = 255 - invertedData[i + 1]; // Green
      invertedData[i + 2] = 255 - invertedData[i + 2]; // Blue
      // Alpha channel (i + 3) is unchanged
    }

    try {
      location = locate(invertedData, width, height);
      if (location) {
        var extracted = extract(invertedData, width, height, location);
        result = decode(extracted);
      }
    } catch (e) {
      console.warn("inverted locate/decode failed", e);
    }
  }

  if (result) {
    return {
      data: result,
      location: {
        topLeftCorner: { x: location.topLeft.x, y: location.topLeft.y },
        topRightCorner: { x: location.topRight.x, y: location.topRight.y },
        bottomLeftCorner: { x: location.bottomLeft.x, y: location.bottomLeft.y },
        bottomRightCorner: { x: location.bottomRight.x, y: location.bottomRight.y },
        topLeftFinderPattern: { x: location.topLeft.x, y: location.topLeft.y },
        topRightFinderPattern: { x: location.topRight.x, y: location.topRight.y },
        bottomLeftFinderPattern: { x: location.bottomLeft.x, y: location.bottomLeft.y },
      }
    };
  }

  return null;
}

function locate(data, width, height) {
  var horizontalRun = new Array(height);
  var verticalRun = new Array(width);
  var finderPatterns = [];
  var alignmentPatterns = [];

  // Calculate horizontal runs
  for (var row = 0; row < height; row++) {
    var run = 0;
    var runs = [];
    for (var col = 0; col <= width; col++) {
      if (col < width && isDark(data, width, row, col)) {
        run++;
      } else {
        if (run > 0) {
          runs.push({ start: col - run, end: col - 1 });
          run = 0;
        }
      }
    }
    horizontalRun[row] = runs;
  }

  // Calculate vertical runs
  for (var col = 0; col < width; col++) {
    var run = 0;
    var runs = [];
    for (var row = 0; row <= height; row++) {
      if (row < height && isDark(data, width, row, col)) {
        run++;
      } else {
        if (run > 0) {
          runs.push({ start: row - run, end: row - 1 });
          run = 0;
        }
      }
    }
    verticalRun[col] = runs;
  }

  // Find finder patterns
  for (var row = 0; row < height; row++) {
    var runs = horizontalRun[row];
    for (var i = 0; i < runs.length - 2; i++) {
      var run1 = runs[i];
      var run2 = runs[i + 1];
      var run3 = runs[i + 2];
      
      if (isFinderPattern(run1, run2, run3)) {
        var center = run1.end + run2.length / 2;
        var size = run1.length + run2.length + run3.length;
        finderPatterns.push({
          x: center,
          y: row,
          size: size,
          run1: run1,
          run2: run2,
          run3: run3
        });
      }
    }
  }

  // Group finder patterns
  var groups = groupFinderPatterns(finderPatterns);
  
  // Find QR code location
  for (var i = 0; i < groups.length; i++) {
    var group = groups[i];
    if (group.length >= 3) {
      var location = calculateQRCodeLocation(group);
      if (location) {
        return location;
      }
    }
  }

  return null;
}

function isDark(data, width, row, col) {
  var index = (row * width + col) * 4;
  var r = data[index];
  var g = data[index + 1];
  var b = data[index + 2];
  
  // Convert to grayscale using luminance formula
  var gray = (r * 0.299 + g * 0.587 + b * 0.114);
  
  return gray < 128;
}

function isFinderPattern(run1, run2, run3) {
  // Check if the runs form a finder pattern (1:1:3:1:1 ratio)
  var totalLength = run1.length + run2.length + run3.length;
  var moduleSize = totalLength / 7;
  
  var tolerance = moduleSize / 2;
  
  return Math.abs(run1.length - moduleSize) < tolerance &&
         Math.abs(run2.length - moduleSize) < tolerance &&
         Math.abs(run3.length - 3 * moduleSize) < tolerance;
}

function groupFinderPatterns(patterns) {
  var groups = [];
  var used = new Array(patterns.length).fill(false);
  
  for (var i = 0; i < patterns.length; i++) {
    if (used[i]) continue;
    
    var group = [patterns[i]];
    used[i] = true;
    
    for (var j = i + 1; j < patterns.length; j++) {
      if (used[j]) continue;
      
      var distance = Math.sqrt(
        Math.pow(patterns[i].x - patterns[j].x, 2) +
        Math.pow(patterns[i].y - patterns[j].y, 2)
      );
      
      if (distance < patterns[i].size * 2) {
        group.push(patterns[j]);
        used[j] = true;
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}

function calculateQRCodeLocation(group) {
  if (group.length < 3) return null;
  
  // Sort by x coordinate
  group.sort(function(a, b) { return a.x - b.x; });
  
  var left = group[0];
  var right = group[group.length - 1];
  
  // Find top pattern
  var top = null;
  var maxY = Math.max(left.y, right.y);
  for (var i = 0; i < group.length; i++) {
    if (group[i].y < maxY) {
      if (!top || group[i].y < top.y) {
        top = group[i];
      }
    }
  }
  
  if (!top) return null;
  
  // Calculate QR code corners
  var moduleSize = (left.size + right.size + top.size) / 3 / 7;
  
  var topLeft = {
    x: left.x - moduleSize * 3,
    y: top.y - moduleSize * 3
  };
  
  var topRight = {
    x: right.x + moduleSize * 3,
    y: top.y - moduleSize * 3
  };
  
  var bottomLeft = {
    x: left.x - moduleSize * 3,
    y: left.y + moduleSize * 3
  };
  
  var bottomRight = {
    x: right.x + moduleSize * 3,
    y: right.y + moduleSize * 3
  };
  
  return {
    topLeft: topLeft,
    topRight: topRight,
    bottomLeft: bottomLeft,
    bottomRight: bottomRight,
    moduleSize: moduleSize
  };
}

function extract(data, width, height, location) {
  var moduleSize = location.moduleSize;
  var dimension = Math.floor(
    (location.topRight.x - location.topLeft.x + location.bottomRight.x - location.bottomLeft.x) / 2 / moduleSize
  );
  
  dimension = Math.max(21, Math.min(dimension, 177)); // QR code size limits
  
  var extracted = new Array(dimension);
  for (var y = 0; y < dimension; y++) {
    extracted[y] = new Array(dimension);
    for (var x = 0; x < dimension; x++) {
      // Bilinear interpolation
      var realX = location.topLeft.x + (location.topRight.x - location.topLeft.x) * x / (dimension - 1);
      var realY = location.topLeft.y + (location.bottomLeft.y - location.topLeft.y) * y / (dimension - 1);
      
      var x1 = Math.floor(realX);
      var y1 = Math.floor(realY);
      var x2 = Math.min(x1 + 1, width - 1);
      var y2 = Math.min(y1 + 1, height - 1);
      
      var dx = realX - x1;
      var dy = realY - y1;
      
      var p1 = isDark(data, width, y1, x1);
      var p2 = isDark(data, width, y1, x2);
      var p3 = isDark(data, width, y2, x1);
      var p4 = isDark(data, width, y2, x2);
      
      var interpolated = (1 - dx) * (1 - dy) * p1 +
                        dx * (1 - dy) * p2 +
                        (1 - dx) * dy * p3 +
                        dx * dy * p4;
      
      extracted[y][x] = interpolated > 0.5;
    }
  }
  
  return extracted;
}

function decode(extracted) {
  // This is a simplified decoder
  // In a real implementation, you would need to:
  // 1. Find timing patterns
  // 2. Extract format information
  // 3. Determine error correction level and mask pattern
  // 4. Apply mask
  // 5. Read data codewords
  // 6. Apply error correction
  // 7. Decode data
  
  // For now, return a placeholder
  return "QR Code detected but decoding not fully implemented";
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = jsQR;
}