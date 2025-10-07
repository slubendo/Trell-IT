/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarXmark, faHeart} from '@fortawesome/free-regular-svg-icons';
import './App.css'
import { createLike, createTrello, deleteTrello, fetchLikes, fetchPerson, fetchTrellos, updateLike, updateTrello } from './action';
import useSignalR from "./useSignalR";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";




type Section = "BackLog" | "Ready" | "Doing" | "Review" | "Blocked" | "Done";


type Trello = {
  id: number;
  trelloPersonId:number;
  content: string;
  section:string;
  createdAt: Section;
};

type Columns = Record<Section, Trello[]>;





function App() {
  const [likes, setLikes] = useState<{ id: number; trelloId: number; trelloPersonId:number; liked: boolean; }[]>([]);
  const [persons, setPersons] = useState<{ id: number; title: string; color:string; imageID: number; }[]>([]);
  const [columns, setColumns] = useState<Columns>({
    BackLog: [],
    Ready: [],
    Doing: [],
    Review: [],
    Blocked: [],
    Done: [],
  });
  const [, setClose] = useState<boolean>(true);
  



useEffect(() => {
  async function loadTrellos() {
    try {
      const trellosData = await fetchTrellos();

      const grouped: Columns = {
        BackLog: [],
        Ready: [],
        Doing: [],
        Review: [],
        Blocked: [],
        Done: []
      };

      trellosData.forEach((t: any) => {
        if (grouped[t.section as keyof Columns]) {
          grouped[t.section as keyof Columns].push(t);
        }
      });

      setColumns(grouped);  // only update columns once
    } catch (error) {
      console.error("Error fetching trellos:", error);
    }
  }

  async function loadLikesAndPersons() {
    try {
      const [likeData, personData] = await Promise.all([fetchLikes(), fetchPerson()]);

      setLikes(likeData);

      const sortedPersons = personData.sort((a: { id: number }, b: { id: number }) => a.id - b.id);
      setPersons(sortedPersons);
      console.log(persons)
    } catch (error) {
      console.error("Error fetching likes/persons:", error);
    }
  }

  

  loadTrellos();
  loadLikesAndPersons();
}, []);




const { connection: connectionTrello } = useSignalR("http://localhost:5193/r/trelloHub");
const { connection: connectionTrelloLike } = useSignalR("http://localhost:5193/r/trellolikeHub");



useEffect(() => {
  if (!connectionTrello) {
    return;
  }
  if (!connectionTrelloLike) {
    return;
  }
  // listen for messages from the server
  connectionTrello.on("ReceiveTrello", (trello: Trello) => {
  console.log("Received new Trello:", trello);

  setColumns(prevColumns => {
    const updated: Columns = { ...prevColumns };

    if (updated[trello.section as keyof Columns]) {
      updated[trello.section as keyof Columns] = [
        ...updated[trello.section as keyof Columns],
        trello
      ];
    }

    return updated;
  });
});



    connectionTrello.on("UpdatedTrello", (trello: Trello) => {
      console.log("Received Updated Trello: ", trello);

      setColumns(prevColumns => {
        const updated: Columns = { ...prevColumns };

        // Remove from all sections (in case section changed)
        for (const section in updated) {
          updated[section as keyof Columns] = updated[section as keyof Columns].filter(
            t => t.id !== trello.id
          );
        }

        // Add to the new section
        if (updated[trello.section as keyof Columns]) {
          updated[trello.section as keyof Columns] = [
            ...updated[trello.section as keyof Columns],
            trello
          ];
        }

        return updated;
      });
    });

 connectionTrello.on("DeleteTrello", (deletedTrelloId: number) => {
  console.log("Received delete Trello:", deletedTrelloId);

  setColumns(prevColumns => {
    const updated: Columns = {} as Columns;

    // loop each section and filter out the deleted card
    (Object.keys(prevColumns) as (keyof Columns)[]).forEach(section => {
      updated[section] = prevColumns[section].filter(
        card => card.id !== deletedTrelloId
      );
    });

  return updated;
});

  connectionTrelloLike.on("ReceiveLike", (like: {
        id: number;
        trelloId: number;
        trelloPersonId: number;
        liked: boolean;
      }) => {
        console.log('Received like:', like);

        // Map to your internal state shape if needed
        setLikes(prevLikes => [...prevLikes, {
          id: like.id,
          trelloId: like.trelloId,
          trelloPersonId: like.trelloPersonId,
          liked: like.liked
        }]);
      });

    connectionTrelloLike.on("UpdateLike", (id:number) => {
    // from the server
      setLikes(prevLikes =>
        prevLikes.map(like =>
          like.id === id
            ? { ...like, liked: !like.liked } // toggle liked
            : like // leave others unchanged
        )
    );
  });

});


  return () => {
    console.log("off")
    connectionTrello.off("ReceiveTrello");
    connectionTrello.off("UpdatedTrello");
    connectionTrello.off("DeleteTrello");
    connectionTrelloLike.off("ReceiveLike");
    connectionTrelloLike.off("UpdateLike");
  };
}, [connectionTrello, connectionTrelloLike]);






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

  const likedTrello = likes.find((like: any) => like.id === id);

  if (likedTrello) {
    console.log(likedTrello);
    console.log(likedTrello.liked)
    await updateLike(likedTrello.id, likedTrello.trelloId, likedTrello.liked);
    connectionTrelloLike?.invoke("UpdateLike", id)
  } else {
    console.log("hey");
    const data = await createLike(trelloid);

    const newLike = {
      Id: data.id,
      TrelloId: data.trelloId,
      TrelloPersonId: data.trelloPersonId,
      Liked: data.liked
    };
    connectionTrelloLike?.invoke("CreateLike", newLike)
  }
}


async function handleDelete(id:number) {
  await deleteTrello(id)
  connectionTrello?.invoke("DeleteTrello", id)

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
  const likeDiv = newDiv?.querySelector(".likeDiv");
  const imgDiv = newDiv?.querySelector(".profile-pic");
  const img = imgDiv?.querySelector("img");

  date?.remove();
  likeDiv?.remove();
  if (img) {
    img.src = "/2.png";
    img.className = "w-11 h-11 rounded-full border-blue-300 border-2" 
  }

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

async function handleCreate(id:number, content:string, personId:number, section:string) {
  await createTrello(id, content, personId, section)
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
        handleCreate(id ?? 0, content ?? "", 2, section ?? "")
        
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





function renderLike(trello: any) {

  let likedTrello:any;
  if (likes.length > 0) {
    // Find the first like object that matches the trelloId
     likedTrello = likes.find((like: any) => like.trelloId === trello.id);


      return (
        <FontAwesomeIcon
          key={likedTrello?.id ? 0 :likedTrello?.id}
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




async function handleDragEnd(result: any) {
  const { source, destination } = result;
  if (!destination) return;

  if (
    source.droppableId === destination.droppableId &&
    source.index === destination.index
  ) {
    return;
  }

  const sourceId = source.droppableId as Section;
  const destId = destination.droppableId as Section;

  const sourceCol = [...columns[sourceId]];
  const destCol = [...columns[destId]];
  const [moved] = sourceCol.splice(source.index, 1);

  moved.section = destId;

  destCol.splice(destination.index, 0, moved);

  setColumns({
    ...columns,
    [sourceId]: sourceCol,
    [destId]: destCol,
  });

  // sync backend
  const data = await updateTrello(moved.id, moved.content, moved.section);
  console.log(data)
  connectionTrello?.invoke("UpdateTrello", moved)
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

    <div className='flex flex-row align-middle justify-center' >
      <span className="flex items-center h-6 px-3 my-3 text-md font-semibold text-indigo-700 rounded-full">
        Developer
      </span>
        <img src={`/2.png`} alt=""  className="w-12 h-12 border-blue-300 border-2 rounded-full mr-1"/>
    </div>
  </div>

{/* Main Body */}
  <div className="px-10 mt-6">
    <h1 className="text-2xl font-bold">Team Project Board</h1>
  </div>


{/* Columns Headers */}
<DragDropContext onDragEnd={handleDragEnd}>

    
    <div className="flex flex-grow px-10 mt-4 space-x-6 overflow-auto">
  {Object.entries(columns).map(([section, cards]) => (
    
      <div key={section} className={`Section this-${section} flex flex-col flex-shrink-0 w-72`}>
        <div className="flex items-center flex-shrink-0 h-10 px-2">
          <span className="block text-sm font-semibold">{section}</span>
          <button className="flex items-center justify-center w-6 h-6 ml-auto text-indigo-500 rounded hover:bg-indigo-500 hover:text-indigo-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" onClick={handleNew}>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </button>
        </div>

        
  
              {/*Column */}
          
          {section === "BackLog" && (
            <div className="example relative flex flex-col items-start py-4 px-3 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100">
                {/*  delete */}        
                <span className="flex items-center h-6 px-3 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">.Example</span>
                <h4 className="mt-3 text-sm font-medium">This is the title of the card for the thing that needs to be done.</h4>     
                {/* Bottom row: left like button, right date + avatar */}
                    <div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
                      {/* Left side: like button */}
                      <div className="flex likeDiv items-center">
                        <button className="flex items-center ml-1 mr-2">
                            <FontAwesomeIcon icon={faHeart} className='overflow-hidden' style={{color:'gray'}} onClick={exampleLiked}/>
                        </button>
                        <img
                          className="w-9 h-9 border-green-300 border-2 rounded-full mr-1"
                          src="/1.png"
                        />                
                        <img
                          className="w-9 h-9 border-purple-300 border-2 rounded-full mr-1"
                          src="/3.png"
                        />                
                      </div>
      
                      {/* Spacer */}
                      <div className="flex-1"></div>
      
                      {/* Right side: date + avatar */}
                      <div className="flex profile-pic items-center gap-2">
                        <div className="text-gray-500 date">
                          Jan 1
                        </div>
                          <img src={`/2.png`} alt=""  className="w-12 h-12 border-blue-300 border-2 rounded-full mr-1"/>                     
                      </div>
                    </div>
              </div>
      )}

      <Droppable droppableId={section} >
        {(provided) => (
          <div
            key={section}
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`Column this-${section} flex flex-col pb-2 overflow-auto`}
          >
            {cards.map((card, index) => (
              <Draggable key={card.id} draggableId={String(card.id)} index={index}>
                {(provided) => (
              <div
                    key={card.id} 
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${section}-${card.id}`}>
                      
                    <div className="relative flex flex-col items-start p-4 mt-3 bg-white rounded-lg bg-opacity-90 group hover:bg-opacity-100">
                      {/* delete */}
                      <div className="absolute top-0 right-5 flex items-center justify-center hidden w-5 h-5 mt-3 mr-2 text-gray-500 rounded group-hover:flex">
                        <FontAwesomeIcon
                          icon={faCalendarXmark}
                          className="mx-1 hover:bg-gray-200 hover:text-gray-700"
                          style={{ color: "gray" }}
                          onClick={() => handleDelete(card.id)}
                        />
                      </div>
                      <span className={`flex items-center h-6 px-3 text-xs font-semibold text-${persons[card.trelloPersonId].color}-500 bg-${persons[card.trelloPersonId].color}-100 rounded-full`}>
                        {persons[card.trelloPersonId].title}
                      </span>
                      <h4 className="mt-3 text-sm font-medium text-center">{card.content}</h4>

                     <div className="flex items-center w-full mt-3 text-xs font-medium text-gray-400">
                      {/* Left side: like button */}
                      <div className="flex likeDiv items-center">
                        <button className="flex items-center ml-1 mr-2">
                            <FontAwesomeIcon icon={faHeart} className='overflow-hidden' style={{color:'gray'}}  onClick={() => renderLike(card)}/>
                        </button>
                          {likes
                          .filter((like) => like.trelloId === card.id)  
                          .slice(0, 3)                                 
                          .map((like) => {
                            const person = persons.find(p => p.id === like.trelloPersonId); // get correct person
                            if (!person) return null;

                            return (
                              <img className={`w-9 h-9 border-${person.color}-300 border-2 rounded-full mr-1`}
                                key={like.id}
                             // @ts-expect-error variable camelCase
                                src={`/${person.imageId.toString()}.png`}
                                alt="user"
                              />
                            );
                          })
                        }

                        {likes.filter((like) => like.trelloId === card.id).length > 3 && (
                          <span className="mt-1">...others</span>
                      )}
                  
                      </div>
      
                      {/* Spacer */}
                      <div className="flex-1"></div>
      
                      {/* Right side: date + avatar */}
                      <div className="flex profile-pic items-center gap-2">
                        <div className="text-gray-500 date">
                          {card.createdAt}
                        </div>
                        {(() => {
                            const person = persons.find(p => p.id == card.trelloPersonId);
                            if (!person) return null;
                            return (
                              <img
                                className={`w-12 h-12 border-${person.color}-300 rounded-full border-2`}
                                // @ts-expect-error variable camelCase
                                src={`/${person.imageId.toString()}.png`}
                                alt="user"
                              />
                            );
                          })()}
                      </div>
                    </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>


            </div>
            ))}
          </div>
      </DragDropContext>




  </div>
</div>
  )
}

export default App
