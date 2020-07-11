import React, { Component }from "react";
import { Container, Row, Col, Image } from "react-bootstrap";
import FacesJson from "./components/FacesJson"
import  * as faceapi from "face-api.js";

import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import image from "./sample-img.jpeg"

export default class App extends Component {

  constructor(props){
    super(props);
    this.fullFaceDescriptions = null;
    this.canvas = React.createRef();
    this.targetImg = React.createRef();
    this.thumbNailContainer = React.createRef();

    this.state = {
      thumbNail: {width: 150, height: 150},
      thumbNailContainer: {width: 350, height: 100},
      imgSize: {width: 300, height: 250},
      imgDescription: [{"message": ["Loading..."]}],
      imgDetections: []
    }
  }

  async componentDidMount() {
    // Load models and test image
    await this.loadModels();
    const testImageHTML = document.getElementById('sample-img');
    this.setState({imgSize: {
      width: this.targetImg.current.offsetWidth,
      height: this.targetImg.current.offsetHeight,
    }})

    // Find faces and draw bounding boxes
    await this.drawHTMLImage(this.canvas.current, testImageHTML);
    await this.getFullFaceDescription(this.canvas.current);
    let descriptions = this.drawDescription(this.canvas.current)
    this.setState({
      imgDescription: descriptions
    })

    this.drawCroppedFaces(testImageHTML)
  }

  async loadModels() {
    await faceapi.loadFaceDetectionModel('/models')
  }

  async drawHTMLImage(canvas, img){
    let {width, height} = this.state.thumbNail
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
  }

  getFullFaceDescription = async (canvas) => {
    this.fullFaceDescriptions = await faceapi.detectAllFaces(canvas);
  }

  drawDescription = (canvas) => {
    if (!this.fullFaceDescriptions) {
      throw Error("no faces found")
    }
    faceapi.matchDimensions(this.canvas.current, this.state.imgSize)
    const resizedDetections = faceapi.resizeResults(this.fullFaceDescriptions, this.state.imgSize)
    this.setState({
      imgDetections: resizedDetections
    })
    const faces = []

    resizedDetections.forEach((element, i) => {
      let face = {}
      face.id = i + 1
      face.confidence = element._score
      let dimensions = element._box

      const box = { x: dimensions._x, y: dimensions._y, width: dimensions._width, height: dimensions._y }
      face.dimensions = box

      const drawOptions = {
        label: `Face ${face.id}: \n${face.confidence.toFixed(2)}`,
        lineWidth: 2,
        boxColor: "#2b9db1",
      }
      const drawBox = new faceapi.draw.DrawBox(box, drawOptions)
      drawBox.draw(document.getElementById('canvas'))
      faces.push(face)
    })
    return faces
  }

  drawCroppedFaces = (image) => {
    this.state.imgDetections.forEach((element, i) => {
      if ('_box' in element) {
        let description = element._box
        this.getCroppedFace(this.thumbNailContainer.current, image, description, i)
      }
    });
  }

  getCroppedFace = (canvas, image, faceDim, offset) => {
    let { _x, _y, _width, _height} = faceDim
    const buffer = 20

    var wrh = _width / _height;
    var newWidth = 75;
    var newHeight = newWidth / wrh;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    let x_offset = offset * (newWidth + buffer)

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

  render() {
    return (
      <div className="App">
        <Container>
          <Row>
            <div className="App-header">Find the Faces!</div>
          </Row>
          <Row>
            <Col md={6}>
                <canvas ref={this.canvas} id="canvas" width={this.state.thumbNail.width} height={this.state.thumbNail.height} />
                <Image ref={this.targetImg} className="original-img" src={image} alt="sample-img" id="sample-img" fluid />
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
