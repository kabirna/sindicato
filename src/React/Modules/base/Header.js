import React, { useState, useEffect } from "react";
import { IconButton } from "@material-ui/core";
import { Menu } from "@material-ui/icons";
import { useHistory } from "react-router-dom";
//Assets
import logo from "./../../../assets/media/images/logoSTPRM.png";

const Header = ({ withTitle, withAvatar }) => {
  //History
  const history = useHistory();

  //State
  const [userLogged, setUserLogged] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  //Effects
  useEffect(() => {
    const userFromLocalStorage = JSON.parse(localStorage.getItem("userLogged"));
    setUserLogged(userFromLocalStorage);
  }, []);

  return (
    <div
      className={`header__wrapper ${isMenuOpen ||  withTitle ? "expanded" : ""}`}
    >
      <div className={`header__content`}>
        <div className="header__navbar">
          <IconButton
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
            }}
          >
            <Menu />
          </IconButton>
          <div className="brand__wrapper">
            <img src={logo} alt="STPRM" />
            <span>STPRM</span>
          </div>
        </div>

        {(withTitle && !isMenuOpen) ? (
          <div className="header__userinfo">
            <div className="header__extra__title">
              <div className="header__extra__title__image__wrapper">
                <img src={withAvatar} alt="" />
              </div>
              <span>Lectura de QR</span>
            </div>
          </div>
        ) : isMenuOpen && (
          <div className={`header__userinfo `}>
            <div className="avatar__wrapper">
              <img
                className="header__avatar"
                src={userLogged?.avatar}
                alt="avatar"
              />
            </div>
            <span>{userLogged?.name}</span>
          </div>
        )}
      </div>
      <div className="color__lines__wrapper">
        <div className="color__line green"></div>
        <div className="color__line brown"></div>
        <div className="color__line red"></div>
        <div className="color__line yellow"></div>
      </div>

      <div className={`floating__menu ${isMenuOpen ? "active" : ""}`}>
        <div className="menu__items__wrapper">
          <div
            className="menu__item"
            onClick={() => {
              history.replace("/home");
            }}
          >
            <div className="menu__item__figure"></div>
            <span>Inicio</span>
          </div>
          {/* <div className="menu__item">
            <div className="menu__item__figure"></div>
            <span>Asambleas</span>
          </div> */}
          <div
            className="menu__item"
            onClick={() => {
              setIsMenuOpen(false);
              history.push("/attendance");
            }}
          >
            <div className="menu__item__figure"></div>
            <span>Tomar asistencia</span>
          </div>
        </div>
        <button
          className="button__with__ripple button--blue"
          onClick={() => {
            history.replace("/");
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Header;
