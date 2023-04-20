import React, { useState, useEffect, Fragment, useRef } from "react";
import moment from "moment/moment";
//MUI
import {
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
//Base
import { blockBackKeyDownDefaultBehaviour } from "../base/Utils";
import Header from "../base/Header";
import Loader from "../base/Loader";
//Assets
import qrCode from "./../../../assets/media/images/qrCode.png";
import avatarPlaceholder from "./../../../assets/media/images/avatarPlaceholder.jpg";

let locationInterval;

const AttendanceContainer = () => {
  //Initial states
  const snackbarInitialState = {
    open: false,
    type: "info",
    message: "",
  };

  //State
  const [employeeData, setEmployeeData] = useState(undefined);
  const [snackbar, setSnackbar] = useState(snackbarInitialState);
  const [isLoaderActive, setIsLoaderActive] = useState(false);
  const [activeAssemblies, setActiveAssemblies] = useState([]);
  const [selectedAssembly, setSelectedAssembly] = useState(undefined);
  const [userLogged, setUserLogged] = useState({});
  const [appVersion, setAppVersion] = useState("0.0");
  const [isOnline, setIsOnline] = useState(undefined);
  const [
    isDisabledConfimAttendanceButton,
    setIsDisabledConfimAttendanceButton,
  ] = useState();
  //Map states
  const [showMap, setShowMap] = useState(undefined);
  const [currentLocation, setCurrenLocation] = useState(undefined);
  const [map, setMap] = useState(null);
  const [circleCoords, setCircleCoords] = useState(undefined);
  const [isInside, setIsInside] = useState(false);

  //Effects
  useEffect(() => {
    // console.log("moment", moment());
    // console.log("moment iso", moment().toISOString(true));

    //Listeners
    document.addEventListener("backbutton", blockBackKeyDownDefaultBehaviour);
    document.addEventListener("online", onOnline);
    document.addEventListener("offline", onOffline);

    //Get logged user
    const userFromLocalStorage = JSON.parse(localStorage.getItem("userLogged"));
    console.log("userFromLocalStorage", userFromLocalStorage);
    setUserLogged(userFromLocalStorage);

    getActiveAssemblies();

    //Get App Version
    if (window.cordova) {
      cordova.getAppVersion.getVersionNumber(function (version) {
        console.log("APP version is " + version);
        setAppVersion(version);
      });
    }

    //Watch position (Geolocation)
    if (window.cordova) {
      handleLocationInterval();
      locationInterval = setInterval(handleLocationInterval, 30000);
    } else {
      //setCurrenLocation([19.538967799141428, -89.98367364586038]); //outside
      setCurrenLocation([19.5432485, -90.0]); //inside
    }

    return () => {
      document.removeEventListener(
        "backbutton",
        blockBackKeyDownDefaultBehaviour
      );
      document.removeEventListener("online", onOnline);
      document.removeEventListener("offline", onOffline);

      if (window.cordova) {
        clearInterval(locationInterval);
      }
    };
  }, []);
  useEffect(() => {
    if (selectedAssembly && currentLocation) {
      console.clear();
      console.log("selectedAssembly", selectedAssembly);
      console.log("currentLocation", currentLocation);
      //Configure map

      if (selectedAssembly?.geolocation) {
        console.log("have geolocation");
        setShowMap(true);

        if (!selectedAssembly?.latitude || !selectedAssembly?.longitude) {
          setSnackbar({
            open: true,
            type: "error",
            message: "Esta asamblea no tiene latitud/longitud definidas",
          });
        } else {
          //Turf process
          const currentLocationInLonLat = [
            currentLocation[1],
            currentLocation[0],
          ];
          const circleInLatLon = [
             selectedAssembly.latitude,
             selectedAssembly.longitude,
            //19.5432485, -90,
          ];
          const circleInLonLat = [
             selectedAssembly.longitude,
             selectedAssembly.latitude,
            //-90, 19.5432485,
          ];
          const circleRadius = selectedAssembly.radio;
          var turfPoint = turf.point(currentLocationInLonLat); //longitud, latitud
          var turfCircle = turf.circle(circleInLonLat, circleRadius, {
            units: "meters",
          });

          // map.panTo(
          //   new L.LatLng(selectedAssembly.latitude, selectedAssembly.longitude)
          // );
          const point = new L.geoJSON(turfPoint);
          const circle = new L.geoJSON(turfCircle);

          setCircleCoords({
            latLon: circleInLatLon,
            radius: circleRadius,
          });

          //Verifiy if point is inside circle
          const inside = turf.booleanPointInPolygon(turfPoint, turfCircle);
          console.log("inside", inside);
          if (inside) {
            console.log("show QR Code Scanner");
            setIsInside(true);
            map.fitBounds(circle.getBounds());
          } else {
            setIsInside(false);
            map.fitBounds(point.getBounds());
            //map.panTo(currentLocation);
            setTimeout(() => {
              map?.flyTo(circleInLatLon, map.getZoom());
            }, 500);
          }
        }
      } else {
        setShowMap(false);
      }
    }
  }, [selectedAssembly, currentLocation]);

  //Handlers
  const handleLocationInterval = () => {
    navigator.geolocation.getCurrentPosition(
      geolocationSuccess,
      geolocationError,
      {
        enableHighAccuracy: true,
        timeout: 30000,
      }
    );
  };
  const geolocationSuccess = (position) => {
    //console.log("position", position);
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    //console.log(`Latitude: ${latitude} - Longitude: ${longitude}`);
    setCurrenLocation([latitude, longitude]);
  };
  const geolocationError = () => {
    console.log("geolocationError");
  };

  const getActiveAssemblies = async () => {
    setIsLoaderActive(true);
    //Fetch active assemblies
    try {
      const url = `https://siaee-stprm.com.mx/MobileServices/api/Assembly/ActivePerDay?SectionAccess=${
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
          // setSnackbar({
          //   open: true,
          //   type: "success",
          //   message: responseJSON?.serviceResponseStatus?.message,
          // });
          setActiveAssemblies(responseJSON.resultList);

          //AQUI ESTABA
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
  const handleScanQR = async (employeeGuid) => {
    console.log("handleScanQR", employeeGuid);
    setIsLoaderActive(true);
    try {
      const url = `https://siaee-stprm.com.mx/MobileServices/api/Attendance/QrLector?EmployeeGuid=${employeeGuid}`;
      const response = await fetch(url, {
        method: "POST",
      });
      console.log("response", response);

      if (response.status === 200) {
        const responseJSON = await response.json();
        console.log("responseJSON", responseJSON);
        if (responseJSON?.serviceResponseStatus?.isSuccess) {
          console.log("set employee data", responseJSON.resultEntity);

          setIsLoaderActive(false);
          // setSnackbar({
          //   open: true,
          //   type: "success",
          //   message: "Empleado encontrado",
          // });
          setEmployeeData({
            ...responseJSON.resultEntity,
            employeeGuid,
          });

          //Validar que el empleado escaneada pertenezca a la seccion seleccionada
          if (
            responseJSON?.resultEntity?.idSection ===
            selectedAssembly?.id_Section
          ) {
            console.log("Corresponde a la misma seccion");
            setIsDisabledConfimAttendanceButton(false);
          } else {
            setIsDisabledConfimAttendanceButton(true);
            setSnackbar({
              open: true,
              type: "error",
              message: `No corresponde a la sección ${responseJSON?.resultEntity?.sectionCode} - ${responseJSON?.resultEntity?.sectionName}`,
            });
          }
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
  const handleSaveEmployee = async () => {
    console.log("handleSaveEmployee", employeeData);
    setIsLoaderActive(true);
    try {
      const url = `https://siaee-stprm.com.mx/MobileServices/api/Attendance/Save`;
      const requestBody = {
        attendance: [
          {
            idAssembly: selectedAssembly?.id,
            idEmployee: employeeData.id,
            dateAssembly: moment().format("YYYY-MM-DD HH:mm:ss"), //moment().toISOString(),
            //userAuthorizer: "admin",
            userAuthorizer: userLogged.name,
            employeeGuid: employeeData.employeeGuid,
          },
        ],
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
          console.log("success:", responseJSON.resultList);

          setIsLoaderActive(false);
          setSnackbar({
            open: true,
            type: "success",
            message: responseJSON?.serviceResponseStatus?.message,
          });
          setEmployeeData(undefined);
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

      <Header
        withTitle={"Lectura de QR"}
        withAvatar={
          employeeData
            ? employeeData?.photoBase64
              ? employeeData.photoBase64
              : avatarPlaceholder
            : ""
        }
      />

      <div className="body__wrapper">
        {/* ASSEMBLY SELECTOR */}
        <div className="assembly__selector__wrapper">
          <FormControl fullWidth>
            <InputLabel id="activeAssembliesLabel">Asamblea</InputLabel>
            <Select
              labelId="activeAssembliesLAbel"
              id="activeAssembliesSelect"
              value={selectedAssembly ? selectedAssembly : ""}
              onChange={(e) => {
                setSelectedAssembly(e.target.value);
              }}
              MenuProps={{
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "left",
                },
                transformOrigin: {
                  vertical: "top",
                  horizontal: "left",
                },
                getContentAnchorEl: null,
              }}
            >
              {activeAssemblies.map((item, index) => {
                return (
                  <MenuItem key={item.id} value={item}>
                    {item.description}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </div>
        {/* END ASSEMBLY SELECTOR */}

        {/* MAP WRAPPER */}
        <div className={`map__wrapper ${showMap ? "show__map" : "hide__map"}`}>
          <MapContainer
            style={{ width: "100%", height: 180 }}
            //center={[19.440267931229847, -99.15935219510892]}
            zoom={13}
            maxZoom={17}
            whenCreated={setMap}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              // attribution=""
              // url="http://108.175.13.118/hot/{z}/{x}/{y}.png"
            />
            {circleCoords && (
              <Circle
                center={circleCoords.latLon}
                pathOptions={{
                  fillColor: "red",
                  color: "red",
                  fillOpacity: 0.5,
                }}
                radius={circleCoords.radius}
              />
            )}
            {currentLocation && <Marker position={currentLocation} />}
          </MapContainer>
        </div>
        {/* END MAP WRAPPER */}

        {/* QRCODE IMAGE */}
        <div
          className={`qr__code__image__wrapper ${
            showMap === false ? "show__qrcode__image" : "hide__qrcode__image"
          }`}
        >
          <img src={qrCode} alt="" />
        </div>
        {/* END QRCODE IMAGE */}

        {/* ERROR WHEN CURRENT LOCATION IS OUT OF CIRCLE RADIUS */}
        {showMap && !isInside && (
          <span
            style={{
              textAlign: "center",
              color: "indianred",
              margin: "16px 0",
            }}
          >
            No te encuentras dentro del radio para poder escanear
          </span>
        )}
        {/* END ERROR WHEN CURRENT LOCATION IS OUT OF CIRCLE RADIUS */}

        {/* LOADING MAP MESSAGE */}
        {selectedAssembly && showMap === undefined && <span>Cargando...</span>}
        {/* END LOADING MAP MESSAGE */}

        {/* SCAN QRCODE BUTTON */}
        <button
          className="button__with__ripple button--blue qr__code__scan__button"
          disabled={
            !selectedAssembly || (showMap && !isInside) || showMap === undefined
          }
          onClick={() => {
            if (window.cordova) {
              //Test with Phone
              cordova.plugins.barcodeScanner.scan(
                function (result) {
                  if (!result.cancelled) {
                    if (result?.text) {
                      handleScanQR(result.text);
                    }
                  }
                },
                function (error) {
                  alert("Scanning failed: " + error);
                }
              );
            } else {
              //Test in React
              //handleScanQR("C0B6BE66-D37C-4BD4-B37C-8F90AF57281D");
              handleScanQR("F04ACBCD-62B2-496F-A396-343F4A917724");
            }
          }}
        >
          Escanear código
        </button>
        {/* END SCAN QRCODE BUTTON */}

        {/* EMPLOYEE INFORMATION OVERLAY */}
        <div
          className={`attendance__main__wrapper ${
            employeeData ? "active" : ""
          }`}
        >
          <div className="attendance__wrapper">
            <div className="title__and__subtitle__wrapper">
              <span>Empleado</span>
              <span>{employeeData?.name}</span>
            </div>
            <div className="title__and__subtitle__wrapper">
              <span>Ficha</span>
              <span>{employeeData?.code}</span>
            </div>
            <div className="title__and__subtitle__wrapper">
              <span>Sección</span>
              <span>{`${employeeData?.sectionCode} ${employeeData?.sectionName}`}</span>
            </div>
          </div>

          <div className="attendance__buttons__wrapper">
            <button
              disabled={isDisabledConfimAttendanceButton}
              className="button__with__ripple button--blue"
              onClick={() => {
                handleSaveEmployee();
              }}
            >
              Confirmar
            </button>
            <button
              className="button__with__ripple button--blue"
              onClick={() => {
                setEmployeeData(undefined);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
        {/* EMPLOYEE INFORMATION OVERLAY */}
      </div>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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

export default AttendanceContainer;
