import React, { useEffect, useState, Fragment } from "react";
import moment from "moment";
import "moment/locale/es";
//MUI
import { Snackbar } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
//Base
import Header from "../base/Header";
import Loader from "../base/Loader";
//Utils
import { blockBackKeyDownDefaultBehaviour } from "../base/Utils";
//Assets
import graph from "./../../../assets/media/images/graph.png";

const HomeContainer = () => {
  //State
  const [userLogged, setUserLogged] = useState({});
  const [appVersion, setAppVersion] = useState("0.0");
  const [isOnline, setIsOnline] = useState(undefined);
  const [isLoaderActive, setIsLoaderActive] = useState(false);
  const [attendanceByAssembly, setAttendanceByAssembly] = useState([]);

  //Effects
  useEffect(() => {
    //Listeners
    document.addEventListener("backbutton", blockBackKeyDownDefaultBehaviour);
    document.addEventListener("online", onOnline);
    document.addEventListener("offline", onOffline);

    //Change moment locale
    moment.locale("es");

    //Get logged user
    const userFromLocalStorage = JSON.parse(localStorage.getItem("userLogged"));
    console.log("userFromLocalStorage", userFromLocalStorage);
    setUserLogged(userFromLocalStorage);

    getAttendanceByAssembly();

    //Get App Version
    if (window.cordova) {
      cordova.getAppVersion.getVersionNumber(function (version) {
        console.log("APP version is " + version);
        setAppVersion(version);
      });
    }

    return () => {
      document.removeEventListener(
        "backbutton",
        blockBackKeyDownDefaultBehaviour
      );
      document.removeEventListener("online", onOnline);
      document.removeEventListener("offline", onOffline);
    };
  }, []);

  //Handlers
  const getAttendanceByAssembly = async () => {
    setIsLoaderActive(true);
    //Fetch active assemblies
    try {
      const url = `https://siaee-stprm.com.mx/MobileServices/api/Assembly/AttendanceByAssembly?SectionAccess=${
        JSON.parse(localStorage.getItem("userLogged")).sectionsAccess
      }`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("response", response);
      if (response.status === 200) {
        const responseJSON = await response.json();
        console.log("responseJSON", responseJSON);
        if (responseJSON?.serviceResponseStatus?.isSuccess) {
          console.log("success:", responseJSON.resultList);
          setIsLoaderActive(false);
          setAttendanceByAssembly(responseJSON.resultList);
        } else {
          console.log("ERROR");
          setIsLoaderActive(false);
          setSnackbar({
            open: true,
            type: "error",
            message: responseJSON?.serviceResponseStatus?.message,
          });
        }
      }
    } catch (error) {
      console.log("Error:", error);
      setIsLoaderActive(false);
      setSnackbar({
        open: true,
        type: "error",
        message: `Error: ${error}`,
      });
    }
  };
  const onOnline = () => {
    //console.log("ONLINE!!!");
    setIsOnline(true);
  };
  const onOffline = () => {
    //console.log("OFFLINE!!!");
    setIsOnline(false);
  };

  return (
    <div className="main__container">
      <Loader isLoaderActive={isLoaderActive} />

      <Header />

      <div className="body__wrapper">
        <div className="userinfo__wrapper">
          <div className="userinfo__avatar">
            <img src={userLogged?.avatar} alt="" />
          </div>
          <div className="userinfo__name__and__date">
            <span>{userLogged?.name}</span>
            <span>{moment().format("dddd D MMMM YYYY")}</span>
          </div>
        </div>

        <div className="titles__wrapper">
          <span>Bienvenido</span>
          <span>Asambleas del día</span>
        </div>

        <div className="bordered__content__wrapper">
          <div className="row__item type__header">
            <div className="column__item type__pill">
              <span>Sección</span>
            </div>
            <div className="column__item type__pill">
              <span>Asistencias</span>
            </div>
            <div className="column__item"></div>
          </div>

          {attendanceByAssembly.map((item, index) => {
            return (
              <Fragment key={index}>
                <div className="row__item">
                  <div className="column__item">
                    <span>{item.section}</span>
                  </div>
                  <div className="column__item">
                    <span>{item.totalAttendance}</span>
                  </div>
                  <div className="column__item">
                    <img src={graph} alt="" />
                  </div>
                </div>

                <div className="row__separator"></div>
              </Fragment>
            );
          })}

          {/* <div className="row__item">
            <div className="column__item">
              <span>10</span>
            </div>
            <div className="column__item">
              <span>300</span>
            </div>
            <div className="column__item">
              <img src={graph} alt="" />
            </div>
          </div>

          <div className="row__separator"></div>

          <div className="row__item">
            <div className="column__item">
              <span>20</span>
            </div>
            <div className="column__item">
              <span>500</span>
            </div>
            <div className="column__item">
              <img src={graph} alt="" />
            </div>
          </div> */}
        </div>
      </div>

      <Snackbar open={isOnline === false}>
        <Alert severity={"warning"}>
          Se ha detectado que no cuenta con internet, verifique su conexión
        </Alert>
      </Snackbar>

      <div className="version__wrapper">
        <span>{`V${appVersion}`}</span>
      </div>
    </div>
  );
};

export default HomeContainer;
