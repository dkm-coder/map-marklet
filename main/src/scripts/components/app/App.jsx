//main
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import {GoogleApiWrapper} from 'google-maps-react';

import Marker from './Marker';
import GoogleMapStyle from './styles';

import './styles.scss';


class App extends Component {
  constructor (props) {
    super(props);

    const {lat, lng} = this.props.initialCenter;
    this.state = {
      currentCenter : {
        lat : lat,
        lng: lng,
      },
    };
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevProps.google !== this.props.google) {
      this.loadMap();
    }

    if (prevProps.markers !== this.props.markers) {
      if (this.props.google) {
        //getLatestMarker ressets state, change in state calls renderMarkers
        if (this.props.markers.length === 0) {
          this.renderMarkers();
        } else {
          this.getLatestMarker();
        }
      }
    }

    if (prevState !== this.state) {
      //loadMap calles getLatestMarker which sets state to its latLng
      this.map.panTo(this.state.currentCenter);
      this.renderMarkers();
    }
  }

  loadMap () {
    if (this.props && this.props.google) {
      //if the google api has loaded into props
      const google = this.props.google;
      const maps = google.maps;
      //ref to App's div node
      const mapRef = this.refs.map;
      const node = ReactDOM.findDOMNode(mapRef);

      let zoom = this.props.zoom; //zoom set via default props
      //currentCenter set to default props, initialCenter set in state
      const {lat, lng} = this.state.currentCenter;
      const center = {lat, lng};
      const mapConfig = {
        center: center,
        zoom: zoom,
        styles: GoogleMapStyle,
      };
      this.map = new maps.Map(node, mapConfig);
      this.getLatestMarker();
    }
  }

  getLatestMarker () {
    if (this.props.markers.length > 0) {
      const markers = this.props.markers;
      const latestAddedMarker = markers[markers.length-1];
      //triggers re-render of map to center of latest marker by setting state
      //setting the state triggers componentDidUpdate which checks for state change, reloading the map
      this.setState({
        currentCenter: {
          lat: latestAddedMarker.latLng.lat,
          lng: latestAddedMarker.latLng.lng,
        },
      });
    }
  }

  renderMarkers () {
    if (this.props.markers) {
      //remove all markers from map before resetting them again
      if (this.markers) this.markers.forEach(m => m.setMap(null));

      this.markers = [];

      const markers = this.props.markers;
      const google = this.props.google;

      markers.map(m => {
        const marker = new google.maps.Marker({
          position: m.latLng,
          title: m.title,
        });

        const contentString =
          '<div class="iw-container">' +

            '<div class="iw-title">' +
              `<h2><a href="${m.url}" target="_blank">${m.title}</a></h2>` +
            '</div>' +

            '<div class="iw-body">' +
              `<img src="${m.pic}">` +
              `<div class="iw-desc">${m.desc}</div>` +
            '</div>' +

          '</div>';

        const infowindow = new google.maps.InfoWindow({
          content: contentString,
          maxWidth: 500,
        });

        marker.addListener('click', () => {
          infowindow.open(this.map, marker);
        });

        this.markers.push(marker);
      });
      return this.markers.forEach(m => m.setMap(this.map));
    }
  }

  render () {
    if (!this.props.loaded) {
      return (<div>Loading...</div>);
    }

    return (
      <div ref="map" className="mapStyle">
      </div>
    );
  }
}

App.defaultProps = {
  zoom: 8,
  initialCenter: {
    lat: 64.128288,
    lng: -21.827774,
  },
};

const mapStateToProps = (state) => ({
  markers: state.markers,
});

const connectAppToRedux = connect(mapStateToProps)(App);

export default GoogleApiWrapper({
  apiKey: 'AIzaSyC6xXldmd60eN7osRK0BPQjoCsMKYo0eiI',
})(connectAppToRedux);
