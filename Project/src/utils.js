import * as d3 from "d3";

export var selected_players = []; //contains the sofifa_ids of the selected players
export var selected_players_from_table = [];
export var selected_players_from_pc = [];

export var sc_brush_removed = false;

export var checkboxes_selected = [];

export var list_data;

if (d3.select("#all_checkbox").property("checked")) {
  checkboxes_selected = ["Forward", "Goalkeeper", "Midfielder", "Defender"];
} else {
  if (d3.select("#f_checkbox").property("checked")) {
    checkboxes_selected.push("Forward");
  }
  if (d3.select("#m_checkbox").property("checked")) {
    checkboxes_selected.push("Midfielder");
  }
  if (d3.select("#d_checkbox").property("checked")) {
    checkboxes_selected.push("Defender");
  }
  if (d3.select("#gk_checkbox").property("checked")) {
    checkboxes_selected.push("Goalkeeper");
  }
}

export var colorByRole = {
  Forward: d3.schemeCategory10[1],
  Midfielder: d3.schemeCategory10[2],
  Defender: d3.schemeCategory10[6],
  Goalkeeper: d3.schemeCategory10[9],
};
export var colors = d3.scaleOrdinal(["#7fc97f", "#beaed4", "#fdc086", "#ffff99"]);

export function getLCDropdownSelected() {
  const selectedVal = d3.select("#dropdown_lc").property("value");
  return selectedVal; //tv or pw
}

export function getPlayerData(d, player_color) {
  var keys = Object.keys(d);

  var player_data = {
    sofifa_id: d.sofifa_id,
    axes: [],
    color: player_color,
    short_name: d.short_name,
  };
  var axis;
  for (var i = 3; i < keys.length; i++) {
    if (d[keys[i]] == "") {
      axis = { axis: keys[i], value: "0", color: player_color };
    } else {
      axis = { axis: keys[i], value: d[keys[i]], color: player_color };
    }

    player_data.axes.push(axis);
  }
  return player_data;
}

export function removePlayerFromSelection(player_id) {
  const index = selected_players.indexOf(player_id);
  if (index > -1) {
    selected_players.splice(index, 1); // 2nd parameter means remove one item only
  }
}

export function addPlayerToSelection(player_id) {
  selected_players.push(player_id);
}

export function emptySelection() {
  selected_players = [];
}

export function isPlayerSelected(player_id) {
  for (var i = 0; i < selected_players.length; i++) {
    if (selected_players[i] == player_id) {
      return true;
    }
  }
  return false;
}

//TABLE SELECTION----
export function isPlayerSelectedFromTable(player_id) {
  for (var i = 0; i < selected_players_from_table.length; i++) {
    if (selected_players_from_table[i] == player_id) {
      return true;
    }
  }
  return false;
}
export function addPlayerSelectedFromTable(player_id) {
  selected_players_from_table.push(player_id);
}
export function removePlayerSelectedFromTable(player_id) {
  const index = selected_players_from_table.indexOf(player_id);
  if (index > -1) {
    selected_players_from_table.splice(index, 1); // 2nd parameter means remove one item only
  }
}
export function emptySelectionFromTable() {
  selected_players_from_table = [];
}

//--------------------
//PC SELECTION----
export function isPlayerSelectedFromPC(player_id) {
  for (var i = 0; i < selected_players_from_pc.length; i++) {
    if (selected_players_from_pc[i] == player_id) {
      return true;
    }
  }
  return false;
}
export function addPlayerSelectedFromPC(player_id) {
  selected_players_from_pc.push(player_id);
}

export function removePlayerSelectedFromPC(player_id) {
  const index = selected_players_from_pc.indexOf(player_id);
  if (index > -1) {
    selected_players_from_pc.splice(index, 1); // 2nd parameter means remove one item only
  }
}
export function emptySelectionFromPC() {
  selected_players_from_pc = [];
}

//--------------------

//CHECKBOXES
export function addToCheckboxSelection(role) {
  checkboxes_selected.push(role);
}
export function removeFromCheckboxSelection(role) {
  const index = checkboxes_selected.indexOf(role);
  if (index > -1) {
    checkboxes_selected.splice(index, 1);
  }
  if (checkboxes_selected.length == 0) {
    checkboxes_selected = ["Forward", "Goalkeeper", "Midfielder", "Defender"];
  }
}
export function isCheckboxSelected(role) {
  for (var i = 0; i < checkboxes_selected.length; i++) {
    if (checkboxes_selected[i] == role) {
      return true;
    }
  }
  return false;
}

export function addAllRolesToCheckBoxSelection() {
  if (!isCheckboxSelected("Forward")) {
    //se Forward non c'è già, aggiungilo
    addToCheckboxSelection("Forward");
  }
  if (!isCheckboxSelected("Midfielder")) {
    //se Midfielder non c'è già, aggiungilo
    addToCheckboxSelection("Midfielder");
  }
  if (!isCheckboxSelected("Goalkeeper")) {
    //se GoalKeeper non c'è già, aggiungilo
    addToCheckboxSelection("Goalkeeper");
  }
  if (!isCheckboxSelected("Defender")) {
    //se Defender non c'è già, aggiungilo
    addToCheckboxSelection("Defender");
  }
}
export function removeNotSelectedCheckboxes() {
  checkboxes_selected = [];
}

//PLAYER SELECTED
export var selected_players_data = [];

export function addSelectedPlayerData(player_data) {
  selected_players_data.push(player_data);
  addPlayerSelectedFromTable(player_data.sofifa_id);
}

export function removeSelectedPlayerData(player_data) {
  var index;
  selected_players_data.some((e, i) => {
    if (e.sofifa_id == player_data.sofifa_id) {
      index = i;
    }
    return e.sofifa_id == player_data.sofifa_id;
  });
  if (index > -1) {
    selected_players_data.splice(index, 1);
  }

  removePlayerSelectedFromTable(player_data.sofifa_id);
}

export function isPlayerDataInList(player_id) {
  var isIncluded = selected_players_data.some((e) => {
    return e.sofifa_id == player_id;
  });

  return isIncluded;
}

export function setListData(data) {
  list_data = data;
}

export function isTheSameRequest(lastCheckSelected, checkboxes_selected) {
  if (lastCheckSelected.length === checkboxes_selected.length) {
    return lastCheckSelected.every((element, index) => {
      if (element === checkboxes_selected[index]) {
        return true;
      }

      return false;
    });
  }

  return false;
}
