export async function fetchLikes(){
    const dataBody = await fetch("/api/Likes", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await dataBody.json();
    console.log(data)
  
    return data
  }

  export async function fetchLikeId(id:number){
    const dataBody = await fetch(`/api/Likes/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await dataBody.json();
    console.log(data)
  
    return data
  }

  export async function createLike(id:number) {
    let createLike = {
      id: 0,
      trelloId:id,
      liked: true
    }

    console.log(createLike)

    const dataBody = await fetch(`/api/Likes/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createLike),

    });
    const data = await dataBody.json();
    console.log(data)
  
    return data
  }

  export async function updateLike(id:number, trelloId:number, liked:boolean){
    let updateLike = {
      id: id,
      trelloId:trelloId,
      liked: !liked
    }

    console.log(updateLike)

    const dataBody = await fetch(`/api/Likes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateLike),

    });
    const data = await dataBody.json();
    console.log(data)
  
    return data
  }


  export async function fetchTrellos(){
    const dataBody = await fetch("/api/Trellos", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await dataBody.json();
    console.log(data)
  
    return data
  }


  export async function createTrello(id:number, content:string, section:string){
    let createTrello = {
      id: id,
      content: content,
      section: section,
      createdAt: "2024-02-25T21:11:20.532Z",
    }

    console.log(createTrello)

    const dataBody = await fetch(`/api/Trellos/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createTrello),

    });
    const data = await dataBody.json();
    console.log(data)
  
    return data
  }


  export async function updateTrello(id:number, content:string, section:string){
    let updateTrello = {
      id: id,
      content: content,
      section: section,
      createdAt: "2024-02-25T21:11:20.532Z",
    }

    console.log(updateTrello)

    const dataBody = await fetch(`/api/Trellos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateTrello),

    });
    const data = await dataBody.json();
    console.log(data)
  
    return data
  }

  export async function deleteTrello(id:number){
    const dataBody = await fetch(`/api/Trellos/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await dataBody.json();
    console.log(data)
  
    return data
  }