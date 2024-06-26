import React, { useState, useEffect } from 'react';
import { db } from "../../config/firebase-config";
import { collection, getDocs, where, query, updateDoc, doc, deleteDoc, getDoc } from "firebase/firestore";
import { getAuth, deleteUser as deleteAuthUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import "./Admin.css";

export const Admin = () => {
    const [usersWithRights, setUsersWithRights] = useState([]);
    const [usersWithoutRights, setUsersWithoutRights] = useState([]);
    const [grantRightsUser, setGrantRightsUser] = useState("");
    const [revokeRightsUser, setRevokeRightsUser] = useState("");
    const [userToDelete, setUserToDelete] = useState(null);
    const [loading, setLoading] = useState(true);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const userRef = collection(db, "User");
                const querySnapshot = await getDocs(userRef);

                const usersWithRightsData = [];
                const usersWithoutRightsData = [];
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    if (userData.rights) {
                        usersWithRightsData.push({ id: doc.id, ...userData });
                    } else {
                        usersWithoutRightsData.push({ id: doc.id, ...userData });
                    }
                });

                setUsersWithRights(usersWithRightsData);
                setUsersWithoutRights(usersWithoutRightsData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, []);

    const handleGrantRights = async () => {
        try {
            const userRef = doc(db, "User", grantRightsUser);
            await updateDoc(userRef, { rights: true });

            setUsersWithoutRights(prevUsers =>
                prevUsers.filter(user => user.id !== grantRightsUser)
            );

            const selectedUserData = usersWithoutRights.find(user => user.id === grantRightsUser);
            setUsersWithRights(prevUsers => [...prevUsers, selectedUserData]);

            setGrantRightsUser("");
        } catch (error) {
            console.error("Error granting rights:", error);
        }
    };

    const handleRevokeRights = async () => {
        try {
            const userRef = doc(db, "User", revokeRightsUser);
            await updateDoc(userRef, { rights: false });

            setUsersWithRights(prevUsers =>
                prevUsers.filter(user => user.id !== revokeRightsUser)
            );

            const selectedUserData = usersWithRights.find(user => user.id === revokeRightsUser);
            setUsersWithoutRights(prevUsers => [...prevUsers, selectedUserData]);

            setRevokeRightsUser("");
        } catch (error) {
            console.error("Error revoking rights:", error);
        }
    };

    const reauthenticate = async () => {
        const credential = EmailAuthProvider.credential(
            currentUser.email,
            prompt("Please enter your password to proceed with deletion:")
        );
        try {
            await reauthenticateWithCredential(currentUser, credential);
        } catch (error) {
            console.error("Error reauthenticating user:", error);
            throw error;
        }
    };



    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="admin-page">
            <h1>Admin Page</h1>
            <h2>Users with rights:</h2>
            <ul>
                {usersWithRights.map((user, index) => (
                    <li key={index}>{user.email}</li>
                ))}
            </ul>
            <h2>Grant rights to a user:</h2>
            <select value={grantRightsUser} onChange={(event) => setGrantRightsUser(event.target.value)}>
                <option value="">Select a user</option>
                {usersWithoutRights.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.email}
                    </option>
                ))}
            </select>
            <button onClick={handleGrantRights} disabled={!grantRightsUser}>
                Grant Rights
            </button>
            <h2>Revoke rights from a user:</h2>
            <select value={revokeRightsUser} onChange={(event) => setRevokeRightsUser(event.target.value)}>
                <option value="">Select a user</option>
                {usersWithRights.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.email}
                    </option>
                ))}
            </select>
            <button onClick={handleRevokeRights} disabled={!revokeRightsUser}>
                Revoke Rights
            </button>

        </div>
    );
};
