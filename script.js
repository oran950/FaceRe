const imageUpload = document.getElementById('imageUpload')

Promise.all([// before we use 'start' function we loaded the models.
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {//
  const container = document.createElement('div')
  container.style.position = 'relative'
  document.body.append(container)
  const labeledFaceDescriptors = await loadLabeledImages()
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)//0.6 percent of recognise
  let image
  let canvas
  document.body.append('Loaded')
  imageUpload.addEventListener('change', async () => {
    if (image) image.remove()      //remove the erlier image
    if (canvas) canvas.remove()    // remove to erlier square
    image = await faceapi.bufferToImage(imageUpload.files[0]) //take the upload image and convert it to image element
    container.append(image)
    canvas = faceapi.createCanvasFromMedia(image) 
    container.append(canvas)
    const displaySize = { width: image.width, height: image.height } //size of the square faces
    faceapi.matchDimensions(canvas, displaySize)// make the canvas the same size like image
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors() // decide how many faces in the image
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    results.forEach((result, i) => { // each face in image
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)// this is draw the box on the image
    })
  })
}

function loadLabeledImages() {
  const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes','Oran', 'Thor', 'Tony Stark']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(` https://raw.githubusercontent.com/oran950/FaceRe/master/labeled_images/${label}/${i}.jpg`, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ foo: 'bar' }),
        })
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions) 
    })
  )
}
