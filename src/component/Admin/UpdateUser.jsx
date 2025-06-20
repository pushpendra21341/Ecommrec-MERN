// components/Admin/UpdateUser.jsx
import React, { Fragment, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button } from "@mui/material";
import MetaData from "../layout/MetaData";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import SideBar from "./Sidebar";
import { UPDATE_USER_RESET } from "../../constants/userConstants";
import { getUserDetails, updateUser, clearErrors } from "../../actions/userAction";
import Loader from "../layout/Loader/Loader";
import { useParams, useNavigate } from "react-router-dom";
import "./UpdateUser.css";

const UpdateUser = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: userId } = useParams();

  const { loading, error, user } = useSelector((state) => state.userDetails);
  const {
    loading: updateLoading,
    error: updateError,
    isUpdated,
  } = useSelector((state) => state.profile);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (!user || user._id !== userId) {
      dispatch(getUserDetails(userId));
    } else {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    }

    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (updateError) {
      toast.error(updateError);
      dispatch(clearErrors());
    }
    if (isUpdated) {
      toast.success("User Updated Successfully");
      navigate("/admin/users");
      dispatch({ type: UPDATE_USER_RESET });
    }
  }, [dispatch, user, userId, error, updateError, isUpdated, navigate]);

  const submitHandler = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("role", role);
    dispatch(updateUser(userId, formData));
  };

  const lastChange =
    user?.changeHistory?.length > 0
      ? user.changeHistory[user.changeHistory.length - 1]
      : null;

  return (
    <Fragment>
      <MetaData title="Update User" />
      <ToastContainer />
      <div className="dashboard">
        <SideBar />
        <div className="updateUserContainer">
          {loading ? (
            <Loader />
          ) : !user ? (
            <p style={{ color: "red", padding: "1rem" }}>User not found.</p>
          ) : (
            <form className="createProductForm" onSubmit={submitHandler}>
              <h1>Update User</h1>

              <div>
                <PersonIcon />
                <input
                  type="text"
                  placeholder="Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <MailOutlineIcon />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <VerifiedUserIcon />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="">Choose Role</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <Button
                id="createProductBtn"
                type="submit"
                disabled={updateLoading || !role}
              >
                Update
              </Button>

              <div className="readonlyInfo">
                <h2>User Metadata</h2>
                <p>
                  <strong>Joined On:</strong>{" "}
                  {new Date(user.createdAt).toLocaleString()}
                </p>
                <p>
                  <strong>Last Updated:</strong>{" "}
                  {new Date(user.updatedAt).toLocaleString()}
                </p>
                {lastChange && (
                  <>
                    <p>
                      <strong>Last Field Changed:</strong> {lastChange.field}
                    </p>
                    <p>
                      <strong>Changed By:</strong>{" "}
                      {lastChange.changedBy?.name
                        ? `${lastChange.changedBy.name} (${lastChange.changedBy.role})`
                        : "System/Admin"}
                    </p>
                    <p>
                      <strong>Changed At:</strong>{" "}
                      {new Date(lastChange.changedAt).toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default UpdateUser;
