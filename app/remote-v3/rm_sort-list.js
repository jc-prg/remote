dragStartPos   = "";
dragEndPos     = "";
dragStartCount = false;

function remote_slist(target, callback_pos) {

    let handle_element = "<img src='/remote-v3/img/dragndrop.png' style='height:22px;' alt=''>";
    target.classList.add("slist");
    let items = target.getElementsByTagName("li"), current = null, clone = null, startPos = null;


    function handleDragStart(e) {
      current = e.target.closest("li");
      startPos = current.getBoundingClientRect();

      dragStartPos   = Array.from(items).indexOf(current);
      dragStartCount = true;

      for (let it of items) {
        if (it !== current) { it.classList.add("hint"); }
      }
      e.dataTransfer?.setData("text/plain", ""); // Required for Firefox
    }

    function handleDragEnter(e) {
      const li = e.target.closest("li");
      if (li && li !== current) {
        li.classList.add("active");

        // Simulate new position of elements
        let currentPos = Array.from(items).indexOf(current);
        let targetPos = Array.from(items).indexOf(li);

        dragEndPos   = targetPos;

        if (currentPos < targetPos) {
          li.parentNode.insertBefore(current, li.nextSibling);
        } else {
          li.parentNode.insertBefore(current, li);
        }
      }
    }

    function handleDragLeave(e) {
      const li = e.target.closest("li");
      if (li) { li.classList.remove("active"); }
    }

    function handleDragEnd(e) {

        let i = 0;
        let startElement, endElement;

        for (let it of items) {
            it.classList.remove("hint");
            it.classList.remove("active");
            if (i === dragStartPos) { startElement = it; }
            if (i === dragEndPos)   { endElement   = it; }
            i += 1;
            }

        if (dragStartPos !== dragEndPos && dragStartCount === true) {
            let id;
            if (endElement.innerHTML.indexOf("rm-id") > 0) {
                id = endElement.innerHTML.split("</rm-id>")[0];
                id = id.split("<rm-id>")[1];
                }
            else {
                id = "";
                }
            callback_pos(id, target.id, dragStartPos, dragEndPos); dragStartCount = false;
            }

        if (clone) {
            clone.remove();
            clone = null;
            }
    }

    function handleDrop(e) {
      e.preventDefault();
      const li = e.target.closest("li");
      if (li && li !== current) {
        let currentPos = 0, droppedPos = 0;
        for (let it = 0; it < items.length; it++) {
          if (current === items[it]) { currentPos = it; }
          if (li === items[it]) { droppedPos = it; }
        }
        if (currentPos < droppedPos) {
          li.parentNode.insertBefore(current, li.nextSibling);
        } else {
          li.parentNode.insertBefore(current, li);
        }
      }
      handleDragEnd(e);
    }

    function getElementAtTouch(e) {
      const touch = e.targetTouches[0] || e.changedTouches[0];
      return document.elementFromPoint(touch.clientX, touch.clientY);
    }

    let count = 0;
    for (let i of items) {
      // Create and append the handle element
      count += 1;
      let number = document.createElement("span");
      number.className = "slist_number";
      number.innerHTML = count;
      i.insertBefore(number, i.firstChild);

      let handle = document.createElement("span");
      handle.className = "slist_handle";
      handle.innerHTML = handle_element;
      i.insertBefore(handle, i.firstChild);

      // Mouse Events
      handle.ondragstart = handleDragStart;
      handle.ondragenter = handleDragEnter;
      handle.ondragleave = handleDragLeave;
      handle.ondragend   = handleDragEnd;
      handle.ondragover  = e => e.preventDefault();
      handle.ondrop      = handleDrop;

      // Enable dragging only on the handle
      handle.draggable = true;

      // Touch Events
      handle.addEventListener('touchstart', e => {
        handleDragStart(e);
        const touch = e.targetTouches[0];

        // Create a clone of the current element
        clone = current.cloneNode(true);
        clone.classList.add('clone');
        document.body.appendChild(clone);

        // Position the clone at the touch position
        clone.style.left = `${touch.clientX}px`;
        clone.style.top = `${touch.clientY}px`;

        e.preventDefault();
      });

      handle.addEventListener('touchmove', e => {
        const touch = e.targetTouches[0];
        const targetElement = getElementAtTouch(e);

        if (clone) {
          // Move the clone to follow the touch
          clone.style.left = `${touch.clientX}px`;
          clone.style.top = `${touch.clientY}px`;
        }

        if (targetElement && targetElement.nodeName === "LI" && targetElement !== current) {
          handleDragEnter({ target: targetElement });
        }
        e.preventDefault();
      });

      handle.addEventListener('touchend', e => {
        const targetElement = getElementAtTouch(e);

        if (targetElement && targetElement.nodeName === "LI" && targetElement !== current) {
          let currentPos = 0, droppedPos = 0;
          for (let it = 0; it < items.length; it++) {
            if (current === items[it]) { currentPos = it; }
            if (targetElement === items[it]) { droppedPos = it; }
          }
          if (currentPos < droppedPos) {
            targetElement.parentNode.insertBefore(current, targetElement.nextSibling);
          } else {
            targetElement.parentNode.insertBefore(current, targetElement);
          }
        }

        handleDragEnd(e);
      });

      handle.addEventListener('touchcancel', handleDragEnd);
    }
    }

function startDragAndDrop(list_id, callback_pos) {

    remote_slist(document.getElementById(list_id), callback_pos);
    }

function movePosition(id, dnd_list, from, to) {
    rmApi.call("RemoteMove", [id, dnd_list, from, to]);
}


remote_scripts_loaded += 1;
