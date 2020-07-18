import React, { Component }from "react";
import { Container, Row, Col, Image } from "react-bootstrap";
import FacesJson from "./components/FacesJson"
import  * as faceapi from "face-api.js";

import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import defaultImg from "./images/sample-img.jpeg"

export default class App extends Component {

  constructor(props){
    super(props);
    this.canvas = React.createRef();
    this.targetImg = React.createRef();
    this.thumbNailContainer = React.createRef();

    this.state = {
      loading: false,
      thumbNail: {width: 150, height: 150},
      thumbNailContainer: {width: 350, height: 100},
      maxImgContainerSize: {width: 400, height: 300},
      imgSize: {width: 350, height: 250},
      imgDescription: [{"message": ["Ready to find faces!"]}],
      imgDetections: [],
      image: defaultImg,
    }
  }

  async componentDidMount() {
    await faceapi.loadFaceDetectionModel('/models').then(() => {
      this.models = faceapi
    })
  }

  getFullFaceDescription = async () => {
    let fullFaceDescriptions = await this.models.detectAllFaces(this.canvas.current);
    return fullFaceDescriptions
  }

  drawDescription = (descriptions) => {
    faceapi.matchDimensions(this.canvas.current, this.state.imgSize)
    const resizedDetections = faceapi.resizeResults(descriptions, this.state.imgSize)

    this.setState({
      imgDetections: resizedDetections
    })

    const details = {
      width: resizedDetections[0]._imageDims._width,
      height: resizedDetections[0]._imageDims._height,
      faces: []
    }
    resizedDetections.forEach((element, i) => {
      let face = {}
      face.id = i + 1
      face.confidence = element._score
      let dim = element._box

      const box = {
        x: dim._x,
        y: dim._y,
        width: dim._width,
        height: dim._height
      }
      face.dimensions = box

      const drawOptions = {
        label: `Face ${face.id}: \n${face.confidence.toFixed(2)}`,
        lineWidth: 2,
        boxColor: "#2b9db1",
      }
      const drawBox = new faceapi.draw.DrawBox(box, drawOptions)
      drawBox.draw(document.getElementById('canvas'))
      details.faces.push(face)
    })
    return details
  }

  drawCroppedFaces = (image) => {
    this.state.imgDetections.forEach((element, i) => {
      if ('_box' in element) {
        let dim = element._box
        this.getCroppedFace(this.thumbNailContainer.current, image, dim, i)
      }
    });
  }

  getCroppedFace = (canvas, image, faceDim, offset) => {
    const buffer = 20
    const newWidth = 75;
    const x_offset = offset * (newWidth + buffer)

    let { _x, _y, _width, _height} = faceDim
    let scaleX = image.naturalWidth / image.width
    let scaleY = image.naturalHeight / image.height

    let wrh = _width / _height;
    let newHeight = newWidth / wrh;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      image,
      _x * scaleX,
      _y * scaleY,
      _width * scaleX,
      _height * scaleY,
      x_offset,
      0, 
      newWidth,
      newHeight
    )
    ctx.font = "12px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(`Face ${offset+1}`, x_offset, 12);
  }

  reset() {
    const ctx1 = this.canvas.current.getContext("2d");
    const ctx2 = this.thumbNailContainer.current.getContext("2d");
    ctx1.clearRect(0, 0, this.canvas.current.width, this.canvas.current.height);
    ctx2.clearRect(0, 0, this.thumbNailContainer.current.width, this.thumbNailContainer.current.height);

    this.setState({
      imgDetections: []
    })
  }

  findFaces(img) {
    try {
      // Draw image to canvas for detection
      const ctx = this.canvas.current.getContext("2d");
      let {width, height} = this.state.imgSize
      if(img.naturalWidth === 0) {
        throw Error("image failed to load")
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Detect faces
      this.models.detectAllFaces(this.canvas.current).then((descriptions) => {
        if (descriptions.length === 0) {
          alert("no faces detected")
        }
        const resizedDetails = this.drawDescription(descriptions)
        this.setState({imgDescription: resizedDetails})
        this.drawCroppedFaces(img)
      })
    } catch (error) {
      console.log(error);
    }
  }

  findScaleWidthHeight(img) {
    var scaledWidth
    var scaledHeight
    let wrh = img.naturalWidth / img.naturalHeight;

    if (img.naturalHeight > this.state.maxImgContainerSize.height) {
      scaledHeight = this.state.maxImgContainerSize.height
      scaledWidth = scaledHeight * wrh;
      if (scaledWidth > this.state.maxImgContainerSize.width) {
        scaledWidth = this.state.maxImgContainerSize.width
        scaledHeight = scaledWidth/wrh;
      }

    } else if (img.naturalWidth > this.state.maxImgContainerSize.width) {
      scaledWidth = this.state.maxImgContainerSize.width
      scaledHeight = scaledWidth/wrh;
      if (scaledHeight > this.state.maxImgContainerSize.height) {
        scaledHeight = this.state.maxImgContainerSize.height
        scaledWidth = scaledHeight * wrh;
      }
    }
    return {width: scaledWidth, height: scaledHeight}
  }

  handleImageChange(e) {
    e.preventDefault();

    let reader = new FileReader();
    let file = e.target.files[0];

    reader.onloadend = () => {
      this.setState({
        file: file,
        image: reader.result
      });
    }
    this.reset()
    reader.readAsDataURL(file)
  }

  handleFindFaces = event => {
    event.preventDefault()
    this.reset()

    // Get image element, save scaled dimensions and find faces
    const testImageHTML = document.getElementById('sample-img');
    let scaled = this.findScaleWidthHeight(testImageHTML)
    this.setState({imgSize: {
      width: scaled.width,
      height: scaled.height
    }}, () => {
      this.findFaces(testImageHTML)
    });
  }

  render() {
    return (
      <div className="App">
        <Container>
          <Row className="App-header">
            <Col>
              <h1>Find the Faces!</h1>
              <p>Use the default image below or upload your own to see demo of face detection API</p>
              <button
                className="button"
                type="submit"
                onClick={this.handleFindFaces}>
                Click to start
              </button>
            </Col>
          </Row>
          <Row>
            <Col md={6} ref={this.imgCol}>
              <canvas ref={this.canvas} id="canvas" width={this.state.imgSize.width} height={this.state.imgSize.height} />
              <Image
                ref={this.targetImg}
                className="img-display"
                src={this.state.image}
                style={{
                  width: this.state.imgSize.width,
                  height: this.state.imgSize.height,
                }}
                alt="sample-img"
                id="sample-img"
                fluid
              />
              <form className="inputForm">
                <input className="fileInput"
                  type="file"
                  onChange={(e)=>this.handleImageChange(e)} />
              </form>

              <canvas className="crop" ref={this.thumbNailContainer} width={this.state.thumbNailContainer.width} height={this.state.thumbNailContainer.height}/>
            </Col>
            <Col md={6}>
              <FacesJson data={this.state.imgDescription}/>
            </Col>
          </Row>
        </Container>
      </div>
    );

  }
}
