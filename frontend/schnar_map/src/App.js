// import reqs
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import React, { useEffect, useState } from "react";
import Header from './components/Header'
import Footer from './components/Footer'
import * as d3 from 'd3';
import { ToastContainer } from 'react-toastify';

// Geo json files
import stateData from "./data/states.json";

const mapRatio = 0.5;

const margin = { top: 10, bottom: 10, left: 10, right: 10 };

const colorScale = ["#8FB1D0"];

// Function to fetch the CSV data
export const fetchSkiData = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      d3.csv('./data/daily_ski.csv')
        .then(data => {
          if (data.length === 0) {
            resolve(null); // Resolve with null if the CSV is empty
          } else {
            resolve(data);
          }
        })
        .catch(reject);
    }, 1000); // Should be quick (about 1 second delay)
  }).catch(error => {
    console.error('Error loading or processing CSV:', error);
  });
};

// Function to display the US map with ski resorts and functionality (probably should be split up)
function App() {
  // A random color generator state to store the colors
  const colorGenerator = () => {
    return colorScale[Math.floor(Math.random() * colorScale.length)];
  };

  // State to store ski resort data
  const [resorts, setResorts] = useState([]);

  const resizeMap = () => {
    const containerWidth = parseInt(d3.select('.viz').style('width'));
    let width = containerWidth - margin.left - margin.right;
    let height = width * mapRatio;

    d3.select('.viz svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(width);
    // Update the path generator
    const pathGenerator = d3.geoPath().projection(projection);

    d3.selectAll("#states path")
      .attr("d", pathGenerator);

    // Update points position based on the new projection
    d3.selectAll(".points-container circle").attr("transform", function(d) {
      const coords = projection([+d.lon, +d.lat]);
      return coords ? `translate(${coords})` : null;
    });
  };

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

    // Map States Container
    statesGroup.append("g")
      .attr("id", "states")
      .selectAll("path")
      .data(stateData.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("class", "state")
      .attr("fill", colorGenerator);

    // Tooltip container
    const tooltip = d3.select('.viz').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('background', 'white')
      .style('border', '1px solid black')
      .style('border-radius', '5px')
      .style('pointer-events', 'none');

    // Create a container for the points
    const pointsGroup = svg.append("g")
      .attr('class', 'points-container');

    // Load and plot points from CSV
    fetchSkiData().then(data => {
      if (data === null) {
        setResorts([]); // Set resorts to an empty array if no data
      } else {
        setResorts(data);
        data.forEach(point => {
          const coords = projection([+point.lon, +point.lat]);
          if (coords) {
            pointsGroup.append("circle")
              .attr("cx", coords[0])
              .attr("cy", coords[1])
              .attr("r", 5)
              .attr("fill", "red")
              .attr("stroke", "black")
              .attr("stroke-width", 0.3)
              .on("mouseover", function(event, d) {
                d3.select(this)
                  .transition()
                  .duration(200)
                  .attr("r", 10);
                tooltip.transition()
                  .duration(200)
                  .style('opacity', 1);
                tooltip.html(point["Resort Name"] + "<br/>" + point.state + "<br/>" + point["72 Hour Snowfall"])
                  .style('left', (event.pageX) + 'px')
                  .style('top', (event.pageY - 50) + 'px');
              })
              .on("mouseout", function(event, d) {
                d3.select(this)
                  .transition()
                  .duration(200)
                  .attr("r", 5);
                tooltip.transition()
                  .duration(500)
                  .style('opacity', 0);
              });
          } else {
            console.warn('Coordinates could not be projected:', point);
          }
        });
      }
    }).catch(error => {
      console.error('Error loading or processing CSV:', error);
    });

    // Call resizeMap initially to set up the correct sizes
    resizeMap();

    // Add resize event listener
    window.addEventListener('resize', resizeMap);

    return () => {
      // Cleanup
      window.removeEventListener('resize', resizeMap);
    };

  }, []); // end of use effect for the US map

  return (
    <div>
      <Header></Header>
      <div className="viz"></div>
      <div className="ski-resort-list">
        <h2 class="centered">Your Daily Schnar Forecast</h2>
        {resorts.length === 0 ? (
          <p className="centered">Looks like there is nothing to ski right now! Is it summer already?</p>
        ) : (
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
        )}
      </div>
      <ToastContainer />
      <Footer></Footer>
    </div>
  );
}

export default App;
