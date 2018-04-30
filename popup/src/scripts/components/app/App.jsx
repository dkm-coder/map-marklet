//popup
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';
import {GoogleApiWrapper} from 'google-maps-react';
import { WithContext as ReactTags } from 'react-tag-input';
import {COUNTRIES} from './Countries';

import GoogleMap from './GoogleMap';

import './styles.scss';

class App extends Component {
  constructor (props) {
    super(props);
    this.state = {
      textArea: {},
      pageTitle: '',
      tags: [],
      suggestions: COUNTRIES,
    };
  }

  componentDidMount () {
    const pic = window.localStorage.getItem('pic');

    this.getInfoFromSite();

    this.setState({
      textArea: {
        pic: pic ? pic : '',
      },
    });
  }

  getInfoFromSite = () => {
    chrome.tabs.getSelected(null, tab => {
      this.setState({
        pageTitle: tab.title,
      });
    });
  }

  //called when autocomplete field is filled in findCenter() is filled
  //sets the state up for input to Redux store but does not send to store
  placeMarker = (place, latLng, date) => {
    this.setState({
      place: place,
      latLng: latLng,
      date: date.toString(),
    });
  }

  //when a place is selected in the autocomplete field, placeMarker sets the state.
  //change in state is passed to GoogleMap child component which calls setTempMarker
  findCenter = (e) => {
    //const savedEvent = e;
    const findCenterInputRef = this.refs.findCenter;
    const input = ReactDOM.findDOMNode(findCenterInputRef);
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.addListener('place_changed', () => {
      let place = autocomplete.getPlace();
      const date = new Date();
      this.placeMarker(place, place.geometry.location, date);
    });
  }

  //dispatches the action
  addMarker = () => {
    if (this.state.latLng) {
      const pic = document.getElementById('pic').value;
      chrome.tabs.getSelected(null, tab => {

        this.props.addMarker({
          url: tab.url,
          title: tab.title,
          pic: pic,
          place: this.state.place,
          latLng: this.state.latLng,
          date: this.state.date,
        });

        const clearField = {target: {value: ''}} ;
        this.updateTextArea('pic', clearField);

      });
    }
  };

  viewMarkers = () => {
    chrome.tabs.create({
      'url': '/main.html',
    });
  }

  //passed down and called from Marker child component
  deleteMarker = (marker) => {
    marker.center = {
      lat: marker.position.lat(),
      lng: marker.position.lng(),
    };

    // //set prop latLng as stringified version of the center obj
    marker.latLng = JSON.stringify(marker.center);
    this.props.deleteMarker(marker);
  }

  updateTextArea = (id, e) => {
    this.setState({
      textArea: {
        ...this.state.textArea,
        [id]: e.target.value,
      },
    }, () => {
      window.localStorage.setItem(id, this.state.textArea[id]);
    });
  }

  updatePageTitle = (e) => {
    this.setState({
      pageTitle: e.target.value,
    });
  }

  handleAddition = (tag) => {
    this.setState({
      tags: [
        ...this.state.tags,
        ...[tag],
      ],
    });
  }

  handleDelete = (i) => {
    this.setState({
      tags: this.state.tags.filter((tag, index) => index !== i),
    });
  }

  render () {

    if (!this.props.loaded) {
      return (<div>Loading...</div>);
    }

    return (
      <div className="app">

        <GoogleMap ref="map"
          google={this.props.google}
          markers={this.props.markers}
          placeMarker={this.placeMarker}
          deleteMarker={this.deleteMarker}
          place={this.state.place}
          latLng={this.state.latLng}
        />

        <input id="findCenter"
          type="text"
          ref="findCenter"
          onKeyPress={this.findCenter}
          placeholder="find location"
        />

        <textarea id="title" defaultValue={this.state.pageTitle} onChange={(e) => this.updatePageTitle(e)} />

        <ReactTags
          tags={this.state.tags}
          suggestions={this.state.suggestions}
          handleDelete={this.handleDelete.bind(this)}
          handleAddition={this.handleAddition.bind(this)} />

        <textarea id="pic" value={this.state.textArea.pic} onChange={(e) => this.updateTextArea('pic', e)} placeholder="Add a pic by placing its url here..."/>

        <div id="buttons">
          <button onClick={this.addMarker}>Add Marker</button>
          <button onClick={this.viewMarkers}>View Markers</button>
        </div>

      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  markers: state.markers,
});

const mapDispatchToProps = (dispatch) => ({
  addMarker: (marker) => dispatch({
    type: 'ADD_MARKER',
    marker: {
      url: marker.url,
      title: marker.title,
      desc: marker.desc,
      pic: marker.pic,
      place: marker.place,
      latLng: marker.latLng,
      date: marker.date,
    },
  }),

  deleteMarker: (marker) => dispatch({
    type: 'DELETE_MARKER',
    latLng: marker.latLng,
  }),
});

const connectAppToRedux = connect(mapStateToProps, mapDispatchToProps)(App);

export default GoogleApiWrapper({
  apiKey: 'AIzaSyC6xXldmd60eN7osRK0BPQjoCsMKYo0eiI',
})(connectAppToRedux);
