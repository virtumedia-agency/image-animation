/*
Autor: FS11.NET
*/

const desktopConfig = {
    pixelizationFadeTime: 1500,
    pixelSize: 20,
    numPixels: 5
};

const mobileConfig = {
    pixelizationFadeTime: 1000,
    pixelSize: 15,
    numPixels: 4
};

const tabletConfig = {
    pixelizationFadeTime: 1200,
    pixelSize: 18,
    numPixels: 4
};

let config;

if (window.innerWidth < 768) {
    config = mobileConfig;
} else if (window.innerWidth < 1024) {
    config = tabletConfig;
} else {
    config = desktopConfig;
}

const pixelizationFadeTime = config.pixelizationFadeTime;
const pixelSize = config.pixelSize;
const numPixels = config.numPixels;

document.addEventListener("DOMContentLoaded", function() {
    const imageContainers = document.querySelectorAll('.animate-image');

    imageContainers.forEach(imageContainer => {
        const image = imageContainer.querySelector('img');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.className = 'overlay';
        imageContainer.appendChild(canvas);

        const imageWidth = image.width;
        const imageHeight = image.height;

        let pixelizationState = null;
        let fadingInProgress = false;

        async function imageToImageBitmap(image) {
            const bitmap = await createImageBitmap(image);
            return bitmap;
        }

        async function pixelateArea(x, y) {
            if (fadingInProgress) return;

            const imgBitmap = await imageToImageBitmap(image);
            canvas.width = imageWidth;
            canvas.height = imageHeight;
            context.clearRect(0, 0, canvas.width, canvas.height);

            if (pixelizationState) {
                context.putImageData(pixelizationState, 0, 0);
            } else {
                context.drawImage(imgBitmap, 0, 0, imageWidth, imageHeight);
            }

            for (let i = 0; i < numPixels; i++) {
                for (let j = 0; j < numPixels; j++) {
                    const pixelX = x - (pixelSize * numPixels) / 2 + i * pixelSize;
                    const pixelY = y - (pixelSize * numPixels) / 2 + j * pixelSize;
                    const isEdgePixel = i === 0 || j === 0 || i === numPixels - 1 || j === numPixels - 1;
                    const drawEdgePixel = !isEdgePixel || Math.random() < 0.5;

                    if (drawEdgePixel) {
                        const pixelColor = context.getImageData(pixelX, pixelY, 1, 1).data;
                        context.fillStyle = `rgba(${pixelColor[0]}, ${pixelColor[1]}, ${pixelColor[2]}, ${pixelColor[3] / 255})`;
                        context.fillRect(pixelX, pixelY, pixelSize, pixelSize);
                    }
                }
            }

            pixelizationState = context.getImageData(0, 0, canvas.width, canvas.height);

            setTimeout(() => {
                const intervalId = setInterval(() => {
                    let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    let data = imageData.data;
                    let pixelsLeft = false;

                    for (let i = 3; i < data.length; i += 4) {
                        if (data[i] > 0) {
                            pixelsLeft = true;
                            data[i] -= 10; // Zmniejszaj przezroczystość pikseli
                            fadingInProgress = true;
                        }
                    }

                    context.putImageData(imageData, 0, 0);

                    if (!pixelsLeft) {
                        clearInterval(intervalId);
                        fadingInProgress = false;
                        pixelizationState = null;
                    }
                }, 100);
            }, pixelizationFadeTime);
        }

        imageContainer.addEventListener('click', async function(event) {
            if (fadingInProgress) return;

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            await pixelateArea(x, y);
        });
    });
});
