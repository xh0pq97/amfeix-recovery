import React from 'react';  

import AccountBalanceWalletOutlinedIcon from '@material-ui/icons/AccountBalanceWalletOutlined';
import SettingsIcon from '@material-ui/icons/Settings';
import EqualizerIcon from '@material-ui/icons/Equalizer';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';

import BugReportIcon from '@material-ui/icons/BugReport';
import AdbIcon from '@material-ui/icons/Adb';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import AutorenewIcon from '@material-ui/icons/Autorenew';

import VpnKeyIcon from '@material-ui/icons/VpnKey';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';

let captionIconMap = {
  Bitcoin_Wallet: AccountBalanceWalletOutlinedIcon,
  Impact_Fund: EqualizerIcon,
  Settings: SettingsIcon,
  Progress: HourglassEmptyIcon,
  Unlock_wallet: LockOpenIcon,
  Create_wallet: AddCircleOutlineIcon,
  Log_in: VpnKeyIcon,
  Test: AdbIcon,
  Admin: SupervisorAccountIcon
};

let testStatusIcons = { Described: () => <AdbIcon style={{color: "#777"}} />, 
  Failed: () => <BugReportIcon style={{color: "#A77"}} />, 
  Running: () => <AutorenewIcon style={{color: "#997"}} />, 
  Success: () => <AssignmentTurnedInIcon style={{color: "#7A7"}} /> }

export { captionIconMap, testStatusIcons }