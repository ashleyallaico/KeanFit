

export default function convertTimestampToDateString(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString(); 
  }
  