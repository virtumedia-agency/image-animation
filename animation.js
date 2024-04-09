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

document.addEventListener("DOMContentLoaded", function () {
    const imageContainers = document.querySelectorAll('.animate-image');

    imageContainers.forEach(async imageContainer => {
        const image = imageContainer.querySelector('img');
        const canvas = document.createElement('canvas');
        canvas.className = image.className; 
        const context = canvas.getContext('2d', { willReadFrequently: true });
        canvas.className = 'overlay';
        imageContainer.appendChild(canvas);

        const imageWidth = image.width;
        const imageHeight = image.height;

        let pixelizationState = null;
        let fadingInProgress = false;

        async function loadImage(url) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                return createImageBitmap(blob);
            } catch (error) {
                console.error("Error loading image:", error);
                throw error;
            }
        }

        async function pixelateArea(x, y, imgBitmap) {
            if (fadingInProgress) return;
            const imageRect = image.getBoundingClientRect();
            canvas.width = imageRect.width;
            canvas.height = imageRect.height;

            context.clearRect(0, 0, canvas.width, canvas.height);

            if (pixelizationState) {
                context.putImageData(pixelizationState, 0, 0);
            } else {
                context.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);
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
                            data[i] -= 10; // Zmniejszaj przezroczystoĹÄ pikseli
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

        // UtwĂłrz adres URL obrazu przy uĹźyciu CORS Anywhere
        const imageUrl = '' + image.src;

        // Wczytaj obraz
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Ustawienie polityki CORS
        img.src = imageUrl;

        img.onload = function() {
            image.src = imageUrl;
        };

        imageContainer.addEventListener('click', async function (event) {
            if (fadingInProgress) return;

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            try {
                const imgBitmap = await loadImage(image.src);
                await pixelateArea(x, y, imgBitmap);
            } catch (error) {
                console.error("Error:", error);
            }
        });
    });
});
