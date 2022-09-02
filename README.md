# BasicWebGL_Dancing_i

This script animates a capital letter "I" to look like it is bouncing similar to the old pixar lamp. It draws the letter using 2 triangle strips with no degenerate triangles, and then animates the movements using keyframes.

The animation was broken into 4 basic positions and each was assigned a keyframe:

- pre squash
- squash
- post squash
- hover

Each keyframe is a matrix of vertex positions defining the form of the left half only for that keyframe's specific pose. Because the letter "I" is symmetrical, it was possible to use only the left half and calculate the vertex positions of the right half based off the left. A set of matrices (triangleVerticesLeftSide, and triangleVerticesRightSide) hold the current vertex position for the left and right sides of the animated letter at all times. The matrices for the keyframes simply define target positions and do not change over time.

To animate the bouncing letter, the actual vertices for the current position are updated to interpolate between different keyframe targets in the proper sequence. A library called TWEEN (short for in-between), was used to interpolate the vertex positions between different keyframes and then those tweens were chained together  in the correct order to create a looping animation. Again, because the letter is  symmetric, the tweens only interpolate values for the left half of the letter and then every time they update, a function is called to also update the right half of the letter by simply looking at the newly updated left half.