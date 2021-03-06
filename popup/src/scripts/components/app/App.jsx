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
      pageTitle: '',
      tags: [],
      suggestions: COUNTRIES,
      pic: '',
    };
  }

  componentDidMount () {
    this.getInfoFromSite();
    this.getSiteOgImg();
    chrome.identity.getProfileUserInfo((data) => {
      const user = data.email.split('@')[0].replace(/\./g, '-');
      this.props.runMe(user);
    });
  }

  componentDidUpdate () {
    chrome.identity.getProfileUserInfo((data) => {
      const user = data.email.split('@')[0].replace(/\./g, '-');
      this.props.updateMarkersInServer(user, this.props.markers);
    });
  }

  getInfoFromSite = () => {
    chrome.tabs.getSelected(null, tab => {
      this.setState({
        pageTitle: tab.title,
      });
    });
  }

  getSiteOgImg = () => {
    const code = 'var meta = document.querySelector("meta[property=\'og:image\']");' +
           'if (meta) meta = meta.getAttribute("content");' +
           '({' +
           '    ogImg: meta' +
           '});';
    chrome.tabs.executeScript({ code: code }, results => {
      if (!results) return;
      const result = results[0];
      this.setState({
        pic: result.ogImg,
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
      chrome.tabs.getSelected(null, tab => {

        this.props.addMarker({
          url: tab.url,
          title: this.state.pageTitle,
          place: this.state.place,
          latLng: this.state.latLng,
          date: this.state.date,
          tags: this.state.tags,
          pic: this.state.pic,
        });

        // clear fields
        document.getElementById('title').value = '';
        document.getElementsByClassName('og-image')[0].hidden = 1;
        document.getElementsByClassName('ReactTags__tagInputField')[0].value = '';
        document.getElementsByClassName('ReactTags__selected')[0].hidden = 1;

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
          placeholder="Find location"
        />

        <div id="container">
          <div id="sub-container">
            <textarea id="title" defaultValue={this.state.pageTitle} onChange={(e) => this.updatePageTitle(e)} placeholder="Add title"/>
            <ReactTags
              tags={this.state.tags}
              inline={false}
              suggestions={this.state.suggestions}
              handleDelete={this.handleDelete.bind(this)}
              handleAddition={this.handleAddition.bind(this)} />
          </div>
          <div id="pic">
            <img className="og-image" src={this.state.pic} />
          </div>
        </div>

        <div id="buttons">
          <button className="add-bt" onClick={this.addMarker}>Add Marker</button>
          <button className="view-bt" onClick={this.viewMarkers}>View Markers</button>
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
      pic: marker.pic,
      place: marker.place,
      latLng: marker.latLng,
      date: marker.date,
      tags: marker.tags,
    },
  }),

  deleteMarker: (marker) => dispatch({
    type: 'DELETE_MARKER',
    latLng: marker.latLng,
  }),

  runMe: (user) => {
    fetch(`http://localhost:1234/${user}`)
      .then(res => res.json())
      .then(data => {
        console.log("Data received");
        console.log(JSON.stringify(data, null, 4));
        dispatch({ type: 'RECEIVE_INFORMATION', data: data});
      });
  },

  updateMarkersInServer: (user, markers) => {
    console.log(`New markers for ${user}:`);
    console.log(markers);

    fetch(`http://localhost:1234/${user}`, {
      method: 'PUT',
      body: JSON.stringify({markers: markers}),
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    })
      .then(res => console.log('done'));
  },
});

const connectAppToRedux = connect(mapStateToProps, mapDispatchToProps)(App);

export default GoogleApiWrapper({
  apiKey: 'AIzaSyC6xXldmd60eN7osRK0BPQjoCsMKYo0eiI',
})(connectAppToRedux);
