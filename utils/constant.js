const statusCode = {
  success: 0,
  error: 1
}

const role = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  SUB_USER: 3
}

const status = {
  ALLOTTED:'Allotted',
  NOT_ALLOTTED:"Not Allotted"
}

const name = {
  Super_Admin_Name:"revo"
}

const userStatus = {
  ACTIVE:"Active",
  INACTIVE:"Inactive"
}

const jobStatus={
  DONE:"Done",
  NOT_DONE:"Not Done"
}

const outletStatus = {
  OPEN:"Outlet open",
  CLOSE:"Outlet close",
  NOT_FOUND:"Outlet not found"
}

const coolerStatus = {
  FOUND:"Found",
  NOT_FOUND:"Not Found"
}

const sheetStatus = {
  DONE:"Done",
  NOT_DONE:"Not Done"
}

module.exports = {
  statusCode,
  role,
  status,
  name,
  userStatus,
  jobStatus,
  outletStatus,
  coolerStatus,
  sheetStatus
}

