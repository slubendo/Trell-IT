import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faPenToSquare, faTrashCan} from '@fortawesome/free-regular-svg-icons';
import './App.css'
import { createLike, createTrello, deleteTrello, fetchLikes, fetchTrellos, updateLike } from './action';
import useSignalR from "./useSignalR";


type Trello = {
  id: number;
  content: string;
  section:string;
  createdAt: string;
};

type Like = {
  id: number;
  TrelloId: number;
  liked: boolean;
};



function App() {
  const [likes, setLikes] = useState<{ id: number; trelloId: number; liked: boolean; }[]>([]);
  const [trellos, setTrellos] = useState<{ id: number; section: string; content: string; }[]>([]);
  const [close, setClose] = useState(false)  
  const [mount, setMount] = useState(false)



  const { connection: connectionTrello } = useSignalR("/r/trelloHub");
  const { connection: connectionLike } = useSignalR("/r/likeHub");


  useEffect(() => {
    if (!connectionTrello) {
      return;
    }
    // listen for messages from the server
    connectionTrello.on("ReceiveTrello", (trello: Trello) => {
      // from the server
      const newTrello: { id: number; section: string; content: string; } = {
        id: trello.id,
        section: trello.section,
        content: trello.content
      };
      setTrellos((trellos) => [...(trellos || []), newTrello]);
    });

    connectionTrello.on("UpdatedTrello", (trellos: Trello[]) => {
      // from the server
      const UpdatedTrellos = trellos.sort((a: { id: number }, b: { id: number }) => a.id - b.id);
      setTrellos(UpdatedTrellos as { id: number; section: string; content: string; }[]);
    });

    return () => {
      connectionTrello.off("ReceiveTrello");
      connectionTrello.off("UpdatedTrello");
    };
  }, [connectionTrello]);

  useEffect(() => {
    if (!connectionLike) {
      return;
    }
    // listen for messages from the server
    connectionLike.on("ReceiveLike", (updatedLikes: { id: number; trelloId: number; liked: boolean; }[]) => {
      // from the server
      setLikes(updatedLikes);
    });

    return () => {
      connectionLike.off("ReceiveLike");
    };
  }, [connectionLike]);



useEffect(() => {
  async function fetchDataAsync() {
    try {
      const likeData = await fetchLikes();
      const trelloData = await fetchTrellos();

      setLikes(likeData);
      const sortedTrellos = trelloData.sort((a: { id: number }, b: { id: number }) => a.id - b.id);
      setTrellos(sortedTrellos);
      } catch (error) {
      console.error('Error fetching data:', error);
    }
  }
  setMount(false)
  fetchDataAsync();
}, [mount]);



function exampleLiked(e:React.MouseEvent<SVGSVGElement, MouseEvent>) {
  e.preventDefault()
  const icon = e.currentTarget
  console.log(icon)

  if(icon) {
    if(icon.style.color == 'gray') {
      icon.style.color = 'red';
    } else if(icon.style.color == 'red') {
      icon.style.color = 'gray';
    }
  }
}

async function liked(e: React.MouseEvent<SVGSVGElement, MouseEvent>, id: number) {
  e.preventDefault();

  const likedTrello = likes.find((like: any) => like.trelloId === id);

  if (likedTrello) {
    console.log("hello");
    await updateLike(likedTrello.id, likedTrello.trelloId, likedTrello.liked);
  } else {
    console.log("hey");
    await createLike(id);
  }
  connectionTrello?.invoke("UpdateLike", id)
}


async function handleDelete(id:number) {
  setMount(!mount)
  await deleteTrello(id)
}


function handleNew(e:React.MouseEvent<SVGSVGElement, MouseEvent>) {
  e.preventDefault()

  let open = document.querySelectorAll(".open")
  if(open) {
    for(const element of open) {
      element.remove()
    }
    setClose(false)
  }


  const target = e.target;
  let body = document.querySelector("body")

  if(target instanceof HTMLElement || target instanceof SVGSVGElement) {
  let section = target.closest(".Section")
  let column = section?.querySelector(".Column")
  let newSection;

  if(column) {
    for(const sections of column.classList) {
      if(sections.includes("this")) {
        newSection = sections
      }
    }

  }


  const div = column?.querySelector(".relative")
  const newDiv = div?.cloneNode(true) as HTMLElement;
  newDiv.classList.add("open","New", newSection ?? "undefined")
  let h4 = newDiv?.querySelector("h4")
  if(h4 && div) {
    let input = document.createElement("input") 
    input.className = h4.className
    input.classList.remove("text-center")
    input.classList.add("mb-1")
    newDiv.insertBefore(input, h4)

    let span = newDiv.querySelector("span")
    span?.remove()
    let elipse = newDiv.querySelector("button")
    elipse?.remove()

    const button = document.createElement("button")
    button.className = h4.className
    button.classList.remove("text-center", "mt-3")
    button.classList.add("p-1", "text-right", "bg-indigo-500", "rounded", "text-white", "create")
    button.innerHTML = "create"

    h4.insertAdjacentElement("afterend", button); 
    h4.remove()
  }


  column?.appendChild(newDiv)
  }
}

async function handleCreate(id:number, content:string, section:string) {
  setMount(!mount)
  await createTrello(id, content, section)
  let createdTrello = {
    id: id,
    content: content,
    section: section,
    createdAt: "2024-02-25T21:11:20.532Z",
  }

  connectionTrello?.invoke("SendTrello", createdTrello)
}

useEffect(() => {
let body = document.querySelector("body")

if (body) {
  body.addEventListener('click', (event) => {
    event.preventDefault();
    const target = event.target;
    console.log('target', target)
    
    if(target instanceof HTMLElement || target instanceof SVGSVGElement) {

      if (target.classList.contains("create")) {
        let newTrello = body?.querySelector(".New")
        let input = newTrello?.querySelector("input")
        let section;

        if(newTrello) {
          for(const classSections of newTrello?.classList) {
              if(classSections.includes("this")) {
                let splitSection = classSections.split("-")
                section = splitSection[1]
              }
          }

        }
        
        let id;
        let content = input?.value
        console.log(id, content, section)
        handleCreate(id ?? 0, content ?? "", section ?? "")
        
        let open = document.querySelectorAll(".open")
        if(open) {
          for(const element of open) {
            element.remove()
          }
          setClose(false)
        }
      }
    }
  })
}

}, []);

useEffect(() => {
    let open = document.querySelectorAll(".open")
    if(open) {
      for(const element of open) {
        element.remove()
      }
      setClose(false)
    }

}, [close]);


function renderLike(trello: any) {
  if (likes.length > 0) {
    // Find the first like object that matches the trelloId
    const likedTrello = likes.find((like: any) => like.trelloId === trello.id);

    if (likedTrello) {
      console.log("3");
      console.log(likedTrello)
      return (
        <FontAwesomeIcon
          key={likedTrello.id}
          icon={faHeart}
          className="overflow-hidden"
          style={{ color: likedTrello.liked ? "red" : "gray" }}
          onClick={(e) => {
            liked(e, trello.id);
            exampleLiked(e);
            }}
          />
      );
    } else {
      console.log("2");
      return (
        <FontAwesomeIcon
        icon={faHeart}
        className="overflow-hidden"
        style={{ color: "gray" }}
        onClick={(e) => {
        liked(e, trello.id);
        exampleLiked(e);
        }}
      />
      );
    }
  } else {
    console.log("1");
    return (
      <FontAwesomeIcon
        icon={faHeart}
        className="overflow-hidden"
        style={{ color: "gray" }}
        onClick={(e) => {
          liked(e, trello.id);
          exampleLiked(e);
        }}
      />
    );
  }
}




return (
  
<div className=''>

{/* NavBar */}
<div className="flex flex-col w-screen h-screen overflow-auto text-gray-700 bg-gradient-to-tr from-blue-200 via-indigo-200 to-pink-200">
  <div className="flex justify-between items-center flex-shrink-0 w-full h-16 px-10 bg-white bg-opacity-75">
    <div className='flex '>
      <svg className="w-8 h-8 text-indigo-600 stroke-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
      <span className="m-1 text-lg font-semibold text-indigo-700">Trell-IT</span>
    </div>

    <div className="flex items-center justify-center w-8 h-8 ml-auto overflow-hidden rounded-full ">
      <img src="/StephaneLubendo.png" alt="" />
    </div>
  </div>

{/* Main Body */}
  <div className="px-10 mt-6">
    <h1 className="text-2xl font-bold">Team Project Board</h1>
  </div>
{/* Backlog */}
  <div className="flex flex-grow px-10 mt-4 space-x-6 overflow-auto">
    <div className="Section this-BackLog flex flex-col flex-shrink-0 w-72">
      <div className="flex items-center flex-shrink-0 h-10 px-2">
        <span className="block text-sm font-semibold">Backlog</span>
        <button className="flex items-center justify-center w-6 h-6 ml-auto text-indigo-500 rounded hover:bg-indigo-500 hover:text-indigo-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" onClick={handleNew}>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      </div>

      {/* Backlog Column */}
      <div className="Column this-BackLog flex flex-col pb-2 overflow-auto">
        <div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
          {/*  delete */}
          <button className="absolute top-0 right-0 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded hover:bg-gray-200 hover:text-gray-700 group-hover:flex">
            <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          <span className="flex items-center h-6 px-3 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">.Example</span>
          <h4 className="mt-3 text-sm font-medium">This is the title of the card for the thing that needs to be done.</h4>
          <div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
            <button className="flex items-center">
              <FontAwesomeIcon icon={faHeart} className='overflow-hidden' style={{color:'gray'}} onClick={exampleLiked}/>
            </button>
            <img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/women/26.jpg'/>
          </div>
        </div>
        
        {
  trellos.map((trello: any) => {
    if (trello.section === 'BackLog') {
      return (
        <div key={trello.id} className={`BackLog-${trello.id}`}>
          <div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
            {/* delete */}
            <div className="absolute top-0 right-5 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded group-hover:flex">
              <FontAwesomeIcon icon={faTrashCan} className='mx-1 hover:bg-gray-200 hover:text-gray-700' style={{ color: 'gray' }} onClick={() => handleDelete(trello.id)}/>
            </div>
            <span className="flex items-center h-6 px-3 text-xs font-semibold text-blue-500 bg-blue-100 rounded-full">Dev</span>
            <h4 className="mt-3 text-sm font-medium text-center">{trello.content}</h4>
            <div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
              <button className="flex items-center">
              {renderLike(trello)}
              </button>
              <img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/women/26.jpg' />
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  })
}


			</div>
		</div>
{/* End of Backlog */}

{/* Ready */}
		<div className="Section this-Ready flex flex-col flex-shrink-0 w-72">
			<div className="flex items-center flex-shrink-0 h-10 px-2">
				<span className="block text-sm font-semibold">Ready</span>
				<button className="flex items-center justify-center w-6 h-6 ml-auto text-indigo-500 rounded hover:bg-indigo-500 hover:text-indigo-100">
					<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" onClick={handleNew}>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
					</svg>
				</button>
			</div>

      {/* Ready Column */}
			<div className="Column this-Ready flex flex-col pb-2 overflow-auto">
				<div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
					<button className="absolute top-0 right-0 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded hover:bg-gray-200 hover:text-gray-700 group-hover:flex">
						<svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
							<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
						</svg>
					</button>
					<span className="flex items-center h-6 px-3 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">.Example</span>
					<h4 className="mt-3 text-sm font-medium">This is the title of the card for the thing that needs to be done.</h4>
					<div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
        		<button className="flex items-center">
              <FontAwesomeIcon icon={faHeart} className='overflow-hidden' style={{color:'gray'}} onClick={exampleLiked}/>
						</button>
						<img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/women/26.jpg'/>
					</div>
				</div>
				<div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg  bg-opacity-90 group hover:bg-opacity-100" draggable="true">
					<button className="absolute top-0 right-0 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded hover:bg-gray-200 hover:text-gray-700 group-hover:flex">
						<svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
							<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
						</svg>
					</button>
					<span className="flex items-center h-6 px-3 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">.Example</span>
					<h4 className="mt-3 text-sm font-medium">This is the title of the card for the thing that needs to be done.</h4>
					<div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
      		  <button className="flex items-center">
              <FontAwesomeIcon icon={faHeart} className='overflow-hidden' style={{color:'gray'}} onClick={exampleLiked}/>
						</button>
						<img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/men/64.jpg'/>
					</div>
				</div>
        {
  trellos.map((trello: any) => {
    if (trello.section === 'Ready') {
      return (
        <div key={trello.id} className={`Ready-${trello.id}`}>
          <div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
            {/* delete */}
            <div className="absolute top-0 right-5 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded group-hover:flex">
              <FontAwesomeIcon icon={faTrashCan} className='mx-1 hover:bg-gray-200 hover:text-gray-700' style={{ color: 'gray' }} onClick={() => handleDelete(trello.id)}/>
            </div>
            <span className="flex items-center h-6 px-3 text-xs font-semibold text-blue-500 bg-blue-100 rounded-full">Dev</span>
            <h4 className="mt-3 text-sm font-medium text-center">{trello.content}</h4>
            <div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
              <button className="flex items-center">
              {renderLike(trello)}
              </button>
              <img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/women/26.jpg' />
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  })
}
			</div>
		</div>
{/* End of Ready Column */}

{/* Doing*/}
		<div className="Section this-Doing flex flex-col flex-shrink-0 w-72">
			<div className="flex items-center flex-shrink-0 h-10 px-2">
				<span className="block text-sm font-semibold">Doing</span>
				<button className="flex items-center justify-center w-6 h-6 ml-auto text-indigo-500 rounded hover:bg-indigo-500 hover:text-indigo-100">
					<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" onClick={handleNew}>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
					</svg>
				</button>
			</div>

      {/* Doing Column */}
			<div className="Column this-Doing flex flex-col pb-2 overflow-auto">
				<div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg  bg-opacity-90 group hover:bg-opacity-100" draggable="true">
					<button className="absolute top-0 right-0 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded hover:bg-gray-200 hover:text-gray-700 group-hover:flex">
						<svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
							<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
						</svg>
					</button>
					<span className="flex items-center h-6 px-3 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">.Example</span>
					<h4 className="mt-3 text-sm font-medium">This is the title of the card for the thing that needs to be done.</h4>
					<div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
      		  <button className="flex items-center">
              <FontAwesomeIcon icon={faHeart} className='overflow-hidden' style={{color:'gray'}} onClick={exampleLiked}/>
						</button>
						<img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/women/26.jpg'/>
					</div>
				</div>
        {
  trellos.map((trello: any) => {
    if (trello.section === 'Doing') {
      return (
        <div key={trello.id} className={`Doing-${trello.id}`}>
          <div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
            {/* delete */}
            <div className="absolute top-0 right-5 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded group-hover:flex">
              <FontAwesomeIcon icon={faTrashCan} className='mx-1 hover:bg-gray-200 hover:text-gray-700' style={{ color: 'gray' }} onClick={() => handleDelete(trello.id)}/>
            </div>
            <span className="flex items-center h-6 px-3 text-xs font-semibold text-blue-500 bg-blue-100 rounded-full">Dev</span>
            <h4 className="mt-3 text-sm font-medium text-center">{trello.content}</h4>
            <div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
              <button className="flex items-center">
              {renderLike(trello)}
              </button>
              <img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/women/26.jpg' />
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  })
}
			</div>
		</div>
{/* End of Doing */}


{/* Review */}
		<div className="Section this-Review flex flex-col flex-shrink-0 w-72">
			<div className="flex items-center flex-shrink-0 h-10 px-2">
				<span className="block text-sm font-semibold">Review</span>
				<button className="flex items-center justify-center w-6 h-6 ml-auto text-indigo-500 rounded hover:bg-indigo-500 hover:text-indigo-100">
					<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" onClick={handleNew}>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
					</svg>
				</button>
			</div>

      {/* Review Column */}
			<div className="Column this-Review flex flex-col pb-2 overflow-auto">
				<div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg  bg-opacity-90 group hover:bg-opacity-100" draggable="true">
					<button className="absolute top-0 right-0 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded hover:bg-gray-200 hover:text-gray-700 group-hover:flex">
						<svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
							<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
						</svg>
					</button>
					<span className="flex items-center h-6 px-3 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">.Example</span>
					<h4 className="mt-3 text-sm font-medium">This is the title of the card for the thing that needs to be done.</h4>
					<div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
            <button className="flex items-center">
              <FontAwesomeIcon icon={faHeart} className='overflow-hidden' style={{color:'gray'}} onClick={exampleLiked}/>
						</button>
						<img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/men/64.jpg'/>
					</div>
				</div>
				<div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg  bg-opacity-90 group hover:bg-opacity-100" draggable="true">
					<button className="absolute top-0 right-0 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded hover:bg-gray-200 hover:text-gray-700 group-hover:flex">
						<svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
							<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
						</svg>
					</button>
					<span className="flex items-center h-6 px-3 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">.Example</span>
					<h4 className="mt-3 text-sm font-medium">This is the title of the card for the thing that needs to be done.</h4>
					<div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
            <button className="flex items-center">
              <FontAwesomeIcon icon={faHeart} className='overflow-hidden' style={{color:'gray'}} onClick={exampleLiked}/>
						</button>
						<img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/women/44.jpg'/>
					</div>
				</div>
        {
  trellos.map((trello: any) => {
    if (trello.section === 'Review') {
      return (
        <div key={trello.id} className={`Review-${trello.id}`}>
          <div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
            {/* delete */}
            <div className="absolute top-0 right-5 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded group-hover:flex">
              <FontAwesomeIcon icon={faTrashCan} className='mx-1 hover:bg-gray-200 hover:text-gray-700' style={{ color: 'gray' }} onClick={() => handleDelete(trello.id)}/>
            </div>
            <span className="flex items-center h-6 px-3 text-xs font-semibold text-blue-500 bg-blue-100 rounded-full">Dev</span>
            <h4 className="mt-3 text-sm font-medium text-center">{trello.content}</h4>
            <div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
              <button className="flex items-center">
              {renderLike(trello)}
              </button>
              <img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/women/26.jpg' />
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  })
}
			</div>
		</div>
{/* End of Review */}

{/* Blocked */}
		<div className="Section this-Blocked flex flex-col flex-shrink-0 w-72">
			<div className="flex items-center flex-shrink-0 h-10 px-2">
				<span className="block text-sm font-semibold">Blocked</span>
				<button className="flex items-center justify-center w-6 h-6 ml-auto text-indigo-500 rounded hover:bg-indigo-500 hover:text-indigo-100">
					<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" onClick={handleNew}>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
					</svg>
				</button>
			</div>

      {/* Blocked Column */}
			<div className="Column this-Blocked flex flex-col pb-2 overflow-auto">
				<div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg  bg-opacity-90 group hover:bg-opacity-100" draggable="true">
					<button className="absolute top-0 right-0 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded hover:bg-gray-200 hover:text-gray-700 group-hover:flex">
						<svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
							<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
						</svg>
					</button>
					<span className="flex items-center h-6 px-3 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">.Example</span>
					<h4 className="mt-3 text-sm font-medium">This is the title of the card for the thing that needs to be done.</h4>
					<div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
            <button className="flex items-center">
              <FontAwesomeIcon icon={faHeart} className='overflow-hidden' style={{color:'gray'}} onClick={exampleLiked}/>
						</button>
						<img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/women/26.jpg'/>
					</div>
				</div>
        {
  trellos.map((trello: any) => {
    if (trello.section === 'Blocked') {
      return (
        <div key={trello.id} className={`Blocked-${trello.id}`}>
          <div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
            {/* delete */}
            <div className="absolute top-0 right-5 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded group-hover:flex">
              <FontAwesomeIcon icon={faTrashCan} className='mx-1 hover:bg-gray-200 hover:text-gray-700' style={{ color: 'gray' }} onClick={() => handleDelete(trello.id)}/>
            </div>
            <span className="flex items-center h-6 px-3 text-xs font-semibold text-blue-500 bg-blue-100 rounded-full">Dev</span>
            <h4 className="mt-3 text-sm font-medium text-center">{trello.content}</h4>
            <div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
              <button className="flex items-center">
              {renderLike(trello)}
              </button>
              <img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/women/26.jpg' />
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  })
}
			</div>
		</div>
{/* End of blocked Column */}

{/* Done */}
		<div className="Section this-Done flex flex-col flex-shrink-0 w-72">
			<div className="flex items-center flex-shrink-0 h-10 px-2">
				<span className="block text-sm font-semibold">Done</span>
				<button className="flex items-center justify-center w-6 h-6 ml-auto text-indigo-500 rounded hover:bg-indigo-500 hover:text-indigo-100">
					<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" onClick={handleNew}>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
					</svg>
				</button>
			</div>
 
{/* Done Column */}
			<div className="Column this-Done flex flex-col pb-2 overflow-auto">
				<div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg  bg-opacity-90 group hover:bg-opacity-100" draggable="true">
					<button className="absolute top-0 right-0 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded hover:bg-gray-200 hover:text-gray-700 group-hover:flex">
						<svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
							<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
						</svg>
					</button>
					<span className="flex items-center h-6 px-3 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">.Example</span>
					<h4 className="mt-3 text-sm font-medium">This is the title of the card for the thing that needs to be done.</h4>
					<div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
              <button className="flex items-center">
              <FontAwesomeIcon icon={faHeart} className='overflow-hidden' style={{color:'gray'}} onClick={exampleLiked}/>
						</button>
						<img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/women/26.jpg'/>
					</div>
				</div>
        {
  trellos.map((trello: any) => {
    if (trello.section === 'Done') {
      return (
        <div key={trello.id} className={`BackLog-${trello.id}`}>
          <div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
            {/* delete */}
            <div className="absolute top-0 right-5 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded group-hover:flex">
              <FontAwesomeIcon icon={faTrashCan} className='mx-1 hover:bg-gray-200 hover:text-gray-700' style={{ color: 'gray' }} onClick={() => handleDelete(trello.id)}/>
            </div>
            <span className="flex items-center h-6 px-3 text-xs font-semibold text-blue-500 bg-blue-100 rounded-full">Dev</span>
            <h4 className="mt-3 text-sm font-medium text-center">{trello.content}</h4>
            <div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
              <button className="flex items-center">
              {renderLike(trello)}
              </button>
              <img className="w-6 h-6 ml-auto rounded-full" src='https://randomuser.me/api/portraits/women/26.jpg' />
            </div>
          </div>
        </div>
      );
    } else {
      return null;
    }
  })
}

			</div>
		</div>
{/* End of Done Column */}

		<div className="flex-shrink-0 w-6"></div>
    </div>
  </div>


</div>
  )
}

export default App
