import React from "react";
import { HashRouter as Router, Switch, Route } from "react-router-dom";
//Login
import LoginScreen from "./React/Modules/login/LoginScreen";
//Home
import HomeContainer from "./React/Modules/home/HomeContainer";
//Attendace
import AttendanceContainer from "./React/Modules/attendance/AttendanceContainer";

const Routes = () => {
  return (
    <Router basename="/">
      <Switch>
        <Route exact path="/" component={LoginScreen} />
        <Route exact path="/home" component={HomeContainer} />
        <Route exact path="/attendance" component={AttendanceContainer} />
      </Switch>
    </Router>
  );
};

export default Routes;
