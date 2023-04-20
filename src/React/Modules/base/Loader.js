import React from "react";

const Loader = ({ isLoaderActive }) => {
  return (
    <div className={`loader ${isLoaderActive ? "active" : ""}`}>
      <div className="lds-roller">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <span className="loader__title">Espera un momento</span>
      <span className="loader__subtitle">Estamos cargando tu información</span>
    </div>
  );
};

export default Loader;
