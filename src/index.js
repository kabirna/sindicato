import React from "react";
import ReactDOM from "react-dom";
import Routes from "./Routes";
//Styles
import "./assets/styles/css/main.min.css";

const rootComponent = (
  <React.StrictMode>
    <Routes />
  </React.StrictMode>
);

const handleCordovaBehaviour = () => {
  //Screen Orientation
  screen.orientation.lock("portrait");
  startApp();
};

const startApp = () => {
  ReactDOM.render(rootComponent, document.getElementById("root"));
};

if (!window.cordova) {
  //Fired when is not a Cordova app (Testing in web)
  startApp();
} else {
  //Fired whe is a Cordova app (In mobile or emulator)
  document.addEventListener("deviceready", handleCordovaBehaviour, false);
}
