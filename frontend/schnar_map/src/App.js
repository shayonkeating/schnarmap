//App.jsx

import './App.css';
import 'react-toastify/dist/ReactToastify.css';

import React, { useEffect } from "react";

import * as d3 from 'd3'
import { ToastContainer } from 'react-toastify';

// Geo json files
import stateData from "./data/states.json";

const mapRatio = 0.5

const margin = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10
}

const colorScale = ["#B9EDDD", "#87CBB9", "#569DAA", "#577D86"];

function App() {

  // A random color generator
  const colorGenerator = () => {
    return colorScale[Math.floor(Math.random() * 4)]
  }

  useEffect(() => {
    // Check if the SVG already exists
    if (!d3.select('.viz svg').empty()) {
      return; // If it exists, do not append another SVG
    }
  
    let width = parseInt(d3.select('.viz').style('width'));
    let height = width * mapRatio;
  
    width = width - margin.left - margin.right;
  
    const svg = d3.select('.viz').append('svg')
      .attr('class', 'center-container')
      .attr('height', height + margin.top + margin.bottom)
      .attr('width', width + margin.left + margin.right);

    svg.append('rect')
      .attr('class', 'background center-container')
      .attr('height', height + margin.top + margin.bottom)
      .attr('width', width + margin.left + margin.right)

    // Creating projection, it's best to use 'geoAlbersUsa' projection if you're rendering USA map and for other maps use 'geoMercator'.
    const projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(width);

    // Creating path generator fromt the projecttion created above.
    const pathGenerator = d3.geoPath()
      .projection(projection);

    // Creating the container
    const g = svg.append("g")
      .attr('class', 'center-container center-items us-state')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)

    // Creating state layer on top of counties layer.
    g.append("g")
      .attr("id", "states")
      .selectAll("path")
      .data(stateData.features)
      .enter()
      .append("path")
      .attr("key", feature => {
        return feature.properties.NAME
      })
      .attr("d", pathGenerator)
      .attr("class", "state")
      // Here's an example of what I was saying in my previous comment.
      .attr("fill", colorGenerator)
  }, []);

  return (
    <div>
      <div class="viz">
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
