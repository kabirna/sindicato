import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
//MUI
import { Snackbar } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
//Base
import { blockBackKeyDownDefaultBehaviour } from "../base/Utils";
import Loader from "../base/Loader";
//Assets
import logo from "./../../../assets/media/images/logoSTPRM.png";
import avatarPlaceholder from "./../../../assets/media/images/avatar.png";

const LoginScreen = () => {
  //History
  const history = useHistory();

  //Initial states
  const loginDataInitialState = {
    username: "",
    password: "",
  };
  const snackbarInitialState = {
    open: false,
    type: "info",
    message: "",
  };

  //State
  const [loginData, setLoginData] = useState(loginDataInitialState);
  const [snackbar, setSnackbar] = useState(snackbarInitialState);
  const [isLoaderActive, setIsLoaderActive] = useState(false);
  const [appVersion, setAppVersion] = useState("0.0");
  const [isOnline, setIsOnline] = useState(undefined);

  //Effects
  useEffect(() => {
    //Listeners
    document.addEventListener("backbutton", blockBackKeyDownDefaultBehaviour);
    document.addEventListener("online", onOnline);
    document.addEventListener("offline", onOffline);

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
  const handleFormSubmit = async (e) => {
    console.log("handleFormSubmit");
    e.preventDefault();
    setIsLoaderActive(true);

    try {
      //const url = `https://adapiv1.azurewebsites.net/api/UserAuthentication`
      const url = `https://siaee-stprm.com.mx/MobileServices/api/UserAuthentication`;
      const requestBody = {
        userName: loginData.username, //admin
        password: loginData.password, //Adm1n1str@d0r
      };
      console.log("requestBody", requestBody);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      console.log("response", response);

      if (response.status === 200) {
        const responseJSON = await response.json();
        console.log("responseJSON", responseJSON);
        if (responseJSON?.serviceResponseStatus?.isSuccess) {
          console.log("success:", responseJSON.serviceSecurityInfo);
          setIsLoaderActive(false);
          const fakeUserLoggedObject = {
            id: 1,
            name: responseJSON.serviceSecurityInfo.employee,
            sectionsAccess: responseJSON.serviceSecurityInfo.sectionsAccess,
            avatar: avatarPlaceholder,
          };

          localStorage.setItem(
            "userLogged",
            JSON.stringify(fakeUserLoggedObject)
          );

          history.replace({
            pathname: "/home",
          });
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

      <div className="login__header">
        <div className="login__header__content">
          <div className="login__header__logo">
            <img src={logo} alt="STPRM" />
          </div>
          <div className="login__header__text">
            <span>Bienvenido a la aplicación para el pase de la lista.</span>
          </div>
        </div>

        <div className="color__lines__wrapper">
          <div className="color__line green"></div>
          <div className="color__line brown"></div>
          <div className="color__line red"></div>
          <div className="color__line yellow"></div>
        </div>
      </div>

      <div className="login__body">
        <div className="login__title">
          <div className="login__title__separator"></div>
          <span>Por favor ingresa tu usuario y password</span>
          <div className="login__title__separator"></div>
        </div>
        <div className="login__form__wrapper">
          <form onSubmit={handleFormSubmit}>
            <span className="form__label">Usuario:</span>
            <input
              type="text"
              value={loginData.username}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  username: e.target.value,
                })
              }
            />
            <span className="form__label">Password:</span>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  password: e.target.value,
                })
              }
            />
            <button className="button__with__ripple button--blue">
              Ingresar
            </button>
          </form>
        </div>
      </div>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={35008888}
        onClose={() => {
          setSnackbar(snackbarInitialState);
        }}
      >
        <Alert
          onClose={() => {
            setSnackbar(snackbarInitialState);
          }}
          severity={snackbar.type}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

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

export default LoginScreen;
