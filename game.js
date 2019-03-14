"use strict";

// Shader code

const vertexShaderSource = `
attribute vec4 a_position;
uniform vec2 u_translation;
uniform vec2 u_offset;
uniform float u_rotation;
uniform float u_aspect;

void main() {
	
  vec4 scaledPosition = a_position * 0.1;
  float x = scaledPosition.x * cos(u_rotation) - scaledPosition.y * sin(u_rotation) + u_translation.x - u_offset.x;
  float y = (scaledPosition.x * sin(u_rotation) + scaledPosition.y * cos(u_rotation) + u_translation.y) * u_aspect - u_offset.y;
  
  gl_Position = vec4(x,y,0,1);
}
`;

const fragmentShaderSource = `
precision mediump float;

void main() {
  gl_FragColor = vec4(1,0,0,1); 
}
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

function main() {

    // === Initialisation ===

    // get the canvas element & gl rendering 
    const canvas = document.getElementById("c");
    const gl = canvas.getContext("webgl");

    if (gl === null) {
        window.alert("WebGL not supported!");
        return;
    }
    
    // create GLSL shaders, upload the GLSL source, compile the shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program =  createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    // Initialise the array buffer to contain the points of the triangle
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,1,0,0,1]), gl.STATIC_DRAW);

    // Set up the position attribute
    // Note: This has to happen /after/ the array buffer is bound
    const positionAttribute = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
	
	const rotationUniform = gl.getUniformLocation(program, "u_rotation");
	
	const translationUniform = gl.getUniformLocation(program, "u_translation");
	const aspectRatioUniform = gl.getUniformLocation(program, "u_aspect");
	const offsetUniform = gl.getUniformLocation(program, "u_offset");

	
	// === Resizing ===
	
	let resizeCanvas = function() {
		const resolution = window.devicePixelRatio || 1.0;
		const displayWidth = Math.floor(canvas.clientWidth * resolution);
		const displayHeight = Math.floor(canvas.clientHeight * resolution);
		console.log(displayWidth, displayHeight)
		if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			return true;
		} else {
			return false;
		}    
	}
	
	let aspectRatio = function() {
		return canvas.width / canvas.height;
	}
	
	let offset = [0, 0];
	
	// === Controls ===
	
	document.addEventListener("keydown", function(event) {
		if (event.key == "d") {
			offset[0] -= 0.01;
		}
		if (event.key == "a") {
			offset[0] += 0.01;
		}
		if (event.key == "s") {
			offset[1] += 0.01;
		}
		if (event.key == "w") {
			offset[1] -= 0.01;
		}
	});

    // === Per Frame operations ===
	
	let angle = 0;

    let update = function(deltaTime) {
		if (!deltaTime) return;
		const slowDown = 0.1;
		angle += (2*Math.PI*slowDown) / deltaTime;
    };

    let render = function() {
        // clear the screen
        gl.viewport(0, 0, canvas.width, canvas.height);        
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
		
		gl.uniform1f(rotationUniform, angle);
		gl.uniform2fv(translationUniform,[.2, -.2]);
		gl.uniform1f(aspectRatioUniform, aspectRatio());
		gl.uniform2fv(offsetUniform, offset);

        // draw a triangle
        gl.drawArrays(gl.TRIANGLES, 0, 3);   
    };
	
	let timeOfLastFrame;
	
	let timeDiff = function(time) {
		const deltaTime = time - timeOfLastFrame;
		timeOfLastFrame = time;
		return deltaTime;
	}

    let animate = function(time) {
		const deltaTime = timeDiff(time);
		resizeCanvas();
		update(deltaTime);
		render();
		requestAnimationFrame(animate);
	};
	
	animate(0);
}    

