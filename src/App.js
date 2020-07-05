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
    this.face = React.createRef();

    this.state = {
      thumbNail: {width: 150, height: 150},
      imgSize: {width: 300, height: 250},
      imgDescription: [{"message": ["Loading..."]}]
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
    this.drawHTMLImage(this.canvas.current, testImageHTML);
    await this.getFullFaceDescription(this.canvas.current);
    let descriptions = this.drawDescription(this.canvas.current)
    this.setState({
      imgDescription: descriptions
    })

    // Show crop of most dominate face
    let firstFace = this.state.imgDescription[0]._box
    this.getCroppedFace(this.face.current, testImageHTML, firstFace);
  }

  async loadModels() {
    await faceapi.loadFaceDetectionModel('/models')
  }

  drawHTMLImage(canvas, img){
    let {width, height} = this.state.thumbNail
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
  }

  getFullFaceDescription = async (canvas) => {
    this.fullFaceDescriptions = await faceapi.detectAllFaces(canvas);
  }

  drawDescription = (canvas) => {
    faceapi.matchDimensions(this.canvas.current, this.state.imgSize)
    const resizedDetections = faceapi.resizeResults(this.fullFaceDescriptions, this.state.imgSize)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    return resizedDetections
  }

  // drawCroppedFaces = (image) => {
  //   this.state.imgDescription.forEach(element => {
  //     if ('_box' in element) {
  //       this.getCroppedFace(this.face.current, image, element._box)
  //     }
  //   });
  // }

  getCroppedFace = (canvas, image, faceDim) => {
    let { _x, _y, _width, _height} = faceDim
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const magnify = 2

    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      image,
      _x * scaleX,
      _y * scaleY,
      _width * scaleX,
      _height * scaleY,
      0,
      0, 
      _width * magnify,
      _height * magnify 
    )
 
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
                <canvas ref={this.canvas} width={this.state.thumbNail.width} height={this.state.thumbNail.height} />
                <Image ref={this.targetImg} className="original-img" src={image} alt="sample-img" id="sample-img" fluid />
                <canvas className="crop" ref={this.face} width={this.state.thumbNail.width} height={this.state.thumbNail.height}/>
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
