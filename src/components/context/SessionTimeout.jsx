// import React, { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

// const SessionTimeout = () => {
//   const navigate = useNavigate();
//   const timeoutDuration = 30 * 60 * 1000; 
//   // 30 minutes in milliseconds
//   let timer;

//   // Function to reset the timer
//   const resetTimer = () => {
//     if (timer) clearTimeout(timer);
//     timer = setTimeout(() => {
//       // Redirect to default (home) page after timeout
//       navigate('/');
//     }, timeoutDuration);
//   };

//   useEffect(() => {
//     // List of events that will reset the timer
//     const events = ['mousemove', 'keydown', 'click', 'scroll'];

//     // Add event listeners for each event
//     events.forEach((event) => {
//       window.addEventListener(event, resetTimer);
//     });

//     // Initialize the timer
//     resetTimer();

//     // Cleanup event listeners on component unmount
//     return () => {
//       if (timer) clearTimeout(timer);
//       events.forEach((event) => {
//         window.removeEventListener(event, resetTimer);
//       });
//     };
//   }, [navigate]);

//   return null; // This component does not render anything visible
// };

// export default SessionTimeout;
