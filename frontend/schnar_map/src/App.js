import './App.css';
import 'react-toastify/dist/ReactToastify.css';

import React, { useEffect, useState } from "react";
import * as d3 from 'd3';
import { ToastContainer } from 'react-toastify';

// Geo json files
import stateData from "./data/states.json";

const mapRatio = 0.5;

const margin = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10
};

const colorScale = ["#395258", "#436067", "#4d6f77", "#577d86", "#618b95", "#6f98a1"];

function App() {
  // A random color generator
  const colorGenerator = () => {
    return colorScale[Math.floor(Math.random() * colorScale.length)];
  };

  // State to store ski resort data
  const [resorts, setResorts] = useState([]);

  useEffect(() => {
    if (!d3.select('.viz svg').empty()) {
      return;
    }
  
    let width = parseInt(d3.select('.viz').style('width'));
    let height = width * mapRatio;
    width = width - margin.left - margin.right;
  
    const svg = d3.select('.viz').append('svg')
      .attr('class', 'center-container')
      .attr('height', height + margin.top + margin.bottom)
      .attr('width', width + margin.left + margin.right);
  
    const projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(width);
  
    const pathGenerator = d3.geoPath()
      .projection(projection);
  
    const statesGroup = svg.append("g")
      .attr('class', 'center-container center-items us-state')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  
    statesGroup.append("g")
      .attr("id", "states")
      .selectAll("path")
      .data(stateData.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("class", "state")
      .attr("fill", colorGenerator);

    // Create a container for the points
    const pointsGroup = svg.append("g")
      .attr('class', 'points-container');

    // Load and plot points from CSV
    d3.csv('./data/daily_ski.csv').then(data => {
      setResorts(data)
      data.forEach(point => {
        const coords = projection([+point.lon, +point.lat]); // Plot the points from the csv
    
        // Only proceed if projection was successful
        if (coords) {
          pointsGroup.append("circle")
            .attr("cx", coords[0])
            .attr("cy", coords[1])
            .attr("r", 5) 
            .attr("fill", "red")
            .attr("stroke", "black")
            .attr("stroke-width", .3);
        } else {
          console.warn('Coordinates could not be projected:', point);
        }
      });
    }).catch(error => {
      console.error('Error loading or processing CSV:', error);
    });
    
  }, []);
  
  return (
    <div>
      <div className="viz"></div>
      {/* Ski Resort List rendering starts here */}
      <div className="ski-resort-list">
      <h2 class="centered">Your Daily Schnar Forecast</h2>
        <div className="table">
          <div className="table-header">
            <div className="header__item">Ski Resort</div>
            <div className="header__item">State</div>
            <div className="header__item">72 Hour Snowfall</div>
            <div className="header__item">Conditions</div>
            <div className="header__item">Trails Open</div>
          </div>
          <div className="table-content">
            {resorts.map((resort, index) => (
              <div className="table-row" key={index}>
                <div className="table-data">{resort['Resort Name']}</div>
                <div className="table-data">{resort['state']}</div>
                <div className="table-data">{resort['72 Hour Snowfall']}</div>
                <div className="table-data">{resort['Base Depth']}</div>
                <div className="table-data">{`${resort['Trails open']} Trails`}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Ski Resort List rendering ends here */}
      <ToastContainer />
    </div>
  );
}

export default App;

