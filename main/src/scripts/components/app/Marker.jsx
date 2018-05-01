//main-Marker
import React, {Component} from 'react';


class Marker extends Component {
  constructor (props) {
    super(props);
  }

  componentDidMount () {
    this.renderMarker();
  }

  componentDidUpdate () {
    this.renderMarker();
  }

  renderMarker () {
    const google = this.props.google;
    const map = this.props.map;
    const markerInfo = this.props.marker;
    const marker = new google.maps.Marker({
      position: markerInfo.latLng,
      map: map,
      title: markerInfo.title,
    });

    //content window
    const contentString =
      `<h2><a href="${markerInfo.url}" target="_blank">${markerInfo.title}</a></h2>`;
    const infowindow = new google.maps.InfoWindow({
      content: contentString,
    });
    marker.addListener('click', () => {
      infowindow.open(map, marker);
    });
  }

  render () {
    return null;
  }
}

export default Marker;
