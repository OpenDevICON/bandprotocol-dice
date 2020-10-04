import React from 'react';
import { Navbar, NavDropdown, Nav } from 'react-bootstrap';
import ReactTooltip from 'react-tooltip';
import { formatAddress } from '../utils/formatting';

export default function ({ wallets, currentWallet, gameStatus, userStatus, handleWalletChange, handleToggleGameStatus }) {
  return (
    <Navbar className='navbar' expand="lg">
      <Navbar.Brand href="#home">DICE</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="ml-auto">
          <Nav.Link>
            <span 
              data-tip='Click to Toggle'
              onClick={handleToggleGameStatus}
            >
              <span className={gameStatus ? 'green-circle' : 'red-circle'} />
              Game Status 
            </span>
          </Nav.Link>
          <NavDropdown 
            title={<span>
                    <span className={userStatus ? 'green-circle' : 'red-circle'} /> 
                    <span data-tip={currentWallet}>{formatAddress(currentWallet)}</span>
                  </span>} 
            id="basic-nav-dropdown"
          >
            {wallets.map((wallet, id) => (
              <NavDropdown.Item 
                key={id}
                onClick={()=>handleWalletChange(wallet)}
              >
                <span>{formatAddress(wallet)}</span>
              </NavDropdown.Item>
            ))}
          </NavDropdown>
        </Nav>
      </Navbar.Collapse>
      <ReactTooltip />
    </Navbar>
  );
}