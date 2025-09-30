/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarXmark, faHeart} from '@fortawesome/free-regular-svg-icons';
import './App.css'
import { createLike, createTrello, deleteTrello, fetchLikes, fetchTrellos, updateLike } from './action';
import useSignalR from "./useSignalR";


type Trello = {
  id: number;
  content: string;
  section:string;
  createdAt: string;
};


function App() {
  const [likes, setLikes] = useState<{ id: number; trelloId: number; trelloPersonId:number; liked: boolean; }[]>([]);
  const [trellos, setTrellos] = useState<{ id: number; section: string; content: string; }[]>([]);
  const [close, setClose] = useState(false)  
  const [mount, setMount] = useState(false)



const { connection: connectionTrello } = useSignalR("https://task-it-list.fly.dev/r/trelloHub");
const { connection: connectionTrelloLike } = useSignalR("https://task-it-list.fly.dev/r/trellolikeHub");



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
    if (!connectionTrelloLike) {
      return;
    }
    // listen for messages from the server
    connectionTrelloLike.on("ReceiveLike", (updatedLikes: { id: number; trelloId: number; trelloPersonId:number; liked: boolean; }[]) => {
      // from the server
      setLikes(updatedLikes);
    });

    return () => {
      connectionTrelloLike.off("ReceiveLike");
    };
  }, [connectionTrelloLike]);



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

async function liked(e: React.MouseEvent<SVGSVGElement, MouseEvent>, id: number, trelloid:number) {
  e.preventDefault();

  const likedTrello = likes.find((like: any) => like.trelloId === trelloid);

  if (likedTrello) {
    console.log(likedTrello);
    console.log(likedTrello.liked)
    await updateLike(likedTrello.id, likedTrello.trelloId, likedTrello.liked);
  } else {
    console.log("hey");
    await createLike(trelloid);
  }
  connectionTrelloLike?.invoke("UpdateLike", id)
}


async function handleDelete(id:number) {
  setMount(!mount)
  await deleteTrello(id)
}


function handleNew(e:React.MouseEvent<SVGSVGElement, MouseEvent>) {
  e.preventDefault()

  const open = document.querySelectorAll(".open")
  if(open) {
    for(const element of open) {
      element.remove()
    }
    setClose(false)
  }


  const target = e.target;

  if(target instanceof HTMLElement || target instanceof SVGSVGElement) {
  const section = target.closest(".Section")
  const column = section?.querySelector(".Column")
  let newSection;

  if(column) {
    for(const sections of column.classList) {
      if(sections.includes("this")) {
        newSection = sections
      }
    }

  }

  const body = document.querySelector("body")
  const div = body?.querySelector(".example")
  const newDiv = div?.cloneNode(true) as HTMLElement;
  const date = newDiv?.querySelector(".date");

  date?.remove();
  newDiv.classList.add("open","New", newSection ?? "undefined")
  const h4 = newDiv?.querySelector("h4")
  if(h4 && div) {
    const input = document.createElement("input") 
    input.className = h4.className
    input.classList.remove("text-center")
   input.classList.add(
    "mb-8",            // margin bottom
    "border",           // border
    "border-gray-400",  // gray border
    "rounded",          // rounded corners
    "px-3",             // horizontal padding (width inside)
    "py-2",             // vertical padding (height inside)
    "w-full",           // stretch to full width of parent
    "focus:outline-none",
    "focus:ring-1",
    "focus:ring-indigo-500"
  );   
    newDiv.insertBefore(input, h4)

    const span = newDiv.querySelector("span")
    span?.remove()
    const elipse = newDiv.querySelector("button")
    elipse?.remove()

      const bottomWrapper = document.createElement("div");
      bottomWrapper.classList.add(
        "absolute",
        "bottom-2",
        "left-4",   // match input px-3
        "right-4",             // horizontal padding (width inside) 
        "flex",
        "justify-between",
        "items-center"
      );

    const buttonWrapper = document.createElement("div");
    buttonWrapper.classList.add("flex", "gap-2");

    const button = document.createElement("button")
    button.className = h4.className
    button.classList.remove("text-center", "mt-3")
    button.classList.add("p-1", "text-right", "bg-indigo-500", "rounded", "text-white", "create")
    button.innerHTML = "create"

    const cancelButton = document.createElement("button")
    cancelButton.className = h4.className
    cancelButton.classList.remove("text-center", "mt-3")
    cancelButton.classList.add("p-1", "text-right", "bg-gray-200", "rounded", "cancel")
    cancelButton.innerHTML = "cancel"

    cancelButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const openTrello = (event.target as HTMLElement).closest(".open");
      if (openTrello) openTrello.remove();
      setClose(true);
    });

    // append in correct order: create → cancel
    buttonWrapper.appendChild(button);
    buttonWrapper.appendChild(cancelButton);


      const avatar = newDiv?.querySelector("img");
        if (avatar) {
        avatar.classList.add("w-6", "h-6", "rounded-full");
        avatar.classList.remove("ml-auto");
     }
      
    bottomWrapper.appendChild(buttonWrapper);
    if (avatar) bottomWrapper.appendChild(avatar);

  newDiv.appendChild(bottomWrapper);
    h4.remove()
  }


  column?.appendChild(newDiv)
  }
}

async function handleCreate(id:number, content:string, section:string) {
  setMount(!mount)
  await createTrello(id, content, section)
  const createdTrello = {
    id: id,
    content: content,
    section: section,
    createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }

  connectionTrello?.invoke("SendTrello", createdTrello)
}

useEffect(() => {
const body = document.querySelector("body")

if (body) {
  body.addEventListener('click', (event) => {
    event.preventDefault();
    const target = event.target;
    console.log('target', target)
    
    if(target instanceof HTMLElement || target instanceof SVGSVGElement) {

      if (target.classList.contains("create")) {
        const newTrello = body?.querySelector(".New")
        const input = newTrello?.querySelector("input")
        let section;

        if(newTrello) {
          for(const classSections of newTrello?.classList ?? []) {
              if(classSections.includes("this")) {
                const splitSection = classSections.split("-")
                section = splitSection[1]
              }
          }

        }
        
        let id;
        const content = input?.value
        console.log(id, content, section)
        handleCreate(id ?? 0, content ?? "", section ?? "")
        
        const open = document.querySelectorAll(".open")
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
    const open = document.querySelectorAll(".open")
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


      return (
        <FontAwesomeIcon
          key={likedTrello?.id}
          icon={faHeart}
          className="overflow-hidden"
          style={{ color: likedTrello?.liked ? "red" : "gray" }}
          onClick={(e) => {

            liked(e, likedTrello?.id ?? 0, trello.id);
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
      <img src="https://randomuser.me/api/portraits/women/26.jpg" alt="" />
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
        <div className="example relative flex flex-col items-start py-4 px-3 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
          {/*  delete */}
          <div className="absolute top-1 right-1 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded group-hover:flex">
              <FontAwesomeIcon icon={faCalendarXmark} className='mx-1 hover:bg-gray-200 hover:text-red-700' style={{ color: 'indigo' }} onClick={() => handleDelete(trello.id)}/>
            </div>
          <span className="flex items-center h-6 px-3 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">.Example</span>
          <h4 className="mt-3 text-sm font-medium">This is the title of the card for the thing that needs to be done.</h4>
          
          {/* Bottom row: left like button, right date + avatar */}
              <div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
                {/* Left side: like button */}
                <div className="flex items-center">
                  <button className="flex items-center ml-1 mr-2">
                      <FontAwesomeIcon icon={faHeart} className='overflow-hidden' style={{color:'gray'}} onClick={exampleLiked}/>
                  </button>
                  <img
                    className="w-5 h-5 rounded-full mr-1"
                    src="https://randomuser.me/api/portraits/women/26.jpg"
                  />                
                  <img
                    className="w-5 h-5 rounded-full mr-1"
                    src="https://randomuser.me/api/portraits/women/26.jpg"
                  />                
                  <img
                    className="w-5 h-5 rounded-full mr-1"
                    src="https://randomuser.me/api/portraits/women/26.jpg"
                  />                
                   <span className='mt-1'>...others</span>
            
                </div>

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Right side: date + avatar */}
                <div className="flex items-center gap-2">
                  <div className="text-gray-500 date">
                    Jan 1
                  </div>
                  <img
                    className="w-9 h-9 rounded-full"
                    src="https://randomuser.me/api/portraits/women/26.jpg"
                  />
                </div>
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
              <FontAwesomeIcon icon={faCalendarXmark} className='mx-1 hover:bg-gray-200 hover:text-gray-700' style={{ color: 'gray' }} onClick={() => handleDelete(trello.id)}/>
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


        {
  trellos.map((trello: any) => {
    if (trello.section === 'Ready') {
      return (
        <div key={trello.id} className={`Ready-${trello.id}`}>
          <div className="relative flex flex-col items-start p-4   mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
            {/* delete */}
            <div className="absolute top-0 right-4  items-center justify-center hidden w-5 h-5 mt-3  text-gray-500 rounded group-hover:flex">
              <FontAwesomeIcon icon={faCalendarXmark} className='mx-1 hover:bg-gray-200 hover:text-gray-700' style={{ color: 'gray' }} onClick={() => handleDelete(trello.id)}/>
            </div>
            <span className="flex items-center h-6 px-3 text-xs font-semibold text-blue-500 bg-blue-100 rounded-full">Dev</span>
            <h4 className="mt-3 ml-1 text-sm font-medium text-center">{trello.content}</h4>

              {/* Bottom row: left like button, right date + avatar */}
              <div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
                {/* Left side: like button */}
                <div className="flex items-center">
                  <button className="flex items-center">
                    {renderLike(trello)}
                  </button>
                </div>

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Right side: date + avatar */}
                <div className="flex items-center gap-2">
                  <div className="text-gray-500 date">
                    {new Date(trello.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                  <img
                    className="w-6 h-6 rounded-full"
                    src="https://randomuser.me/api/portraits/women/26.jpg"
                  />
                </div>
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
        {
  trellos.map((trello: any) => {
    if (trello.section === 'Doing') {
      return (
        <div key={trello.id} className={`Doing-${trello.id}`}>
          <div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
            {/* delete */}
            <div className="absolute top-0 right-5 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded group-hover:flex">
              <FontAwesomeIcon icon={faCalendarXmark} className='mx-1 hover:bg-gray-200 hover:text-gray-700' style={{ color: 'gray' }} onClick={() => handleDelete(trello.id)}/>
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
				
        {
  trellos.map((trello: any) => {
    if (trello.section === 'Review') {
      return (
        <div key={trello.id} className={`Review-${trello.id}`}>
          <div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
            {/* delete */}
            <div className="absolute top-0 right-5 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded group-hover:flex">
              <FontAwesomeIcon icon={faCalendarXmark} className='mx-1 hover:bg-gray-200 hover:text-gray-700' style={{ color: 'gray' }} onClick={() => handleDelete(trello.id)}/>
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
				
        {
  trellos.map((trello: any) => {
    if (trello.section === 'Blocked') {
      return (
        <div key={trello.id} className={`Blocked-${trello.id}`}>
          <div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
            {/* delete */}
            <div className="absolute top-0 right-5 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded group-hover:flex">
              <FontAwesomeIcon icon={faCalendarXmark} className='mx-1 hover:bg-gray-200 hover:text-gray-700' style={{ color: 'gray' }} onClick={() => handleDelete(trello.id)}/>
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
		
        {
  trellos.map((trello: any) => {
    if (trello.section === 'Done') {
      return (
        <div key={trello.id} className={`BackLog-${trello.id}`}>
          <div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100" draggable="true">
            {/* delete */}
            <div className="absolute top-0 right-5 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded group-hover:flex">
              <FontAwesomeIcon icon={faCalendarXmark} className='mx-1 hover:bg-gray-200 hover:text-gray-700' style={{ color: 'gray' }} onClick={() => handleDelete(trello.id)}/>
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
