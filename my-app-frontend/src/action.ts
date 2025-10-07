export async function fetchLikes(){
    const dataBody = await fetch("/api/TrelloLikes", {
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
    const dataBody = await fetch(`/api/TrelloLikes/${id}`, {
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

    const TrelloLike = {
      TrelloId: id,
      TrelloPersonId: 1,
      Liked: true
    }

    const dataBody = await fetch(`/api/TrelloLikes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(TrelloLike),

    });
    const data = await dataBody.json();
    console.log(data)
  
    return data
  }

  export async function updateLike(id:number, trelloId:number, liked:boolean){
const updateLike = {
  Id: id,
  TrelloId: trelloId,
  TrelloPersonId: 1,
  Liked: !liked
}


    console.log(updateLike)

    const dataBody = await fetch(`/api/TrelloLikes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateLike),

    });
    const data = await dataBody;
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


  export async function createTrello(id:number, content:string, personId:number, section:string){
    const createTrello = {
      id: id,
      content: content,
      trellopersonid:personId,
      section: section,
      createdAt:  new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
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
    const updateTrello = {
      id: id,
      content: content,
      section: section,
      createdAt:  new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
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

  export async function fetchPerson(){
    const dataBody = await fetch("/api/TrelloPerson", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await dataBody.json();
    console.log(data)
  
    return data
  }