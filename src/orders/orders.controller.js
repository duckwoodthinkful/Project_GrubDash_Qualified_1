const path = require("path");

// Order the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Order this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
  const { orderId } = req.params;
  const byId = orderId ? (order) => order.id === orderId : () => true;
  res.json({ data: orders.filter(byId) });
}

// Check for deliverTo property
function bodyHasDeliverToProperty(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (deliverTo) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a deliverTo",
  });
}

// Check for mobileNumber property
function bodyHasMobileNumberProperty(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a mobileNumber",
  });
}

// Check for status property
function bodyHasStatusProperty(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a status",
  });
}

// Check for dishes property
function bodyHasDishesProperty(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a dishes",
  });
}

// Check that the dishes are valid
function dishesAreValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  var indexAbe = 0;
  if (Array.isArray(dishes) && dishes.length > 0) {
    const result = dishes.every((dish, index) => {
      const quantity = dish.quantity;
      indexAbe = index;
    //   if (!quantity) return false;
      if (Number.isInteger(quantity) && quantity > 0) return true;
      return false;
    });
    if (result) return next();
    return next({
      status: 400,
      message: `Dish ${indexAbe} must have a quantity that is an integer greater than 0`,
    });
  }
  next({
    status: 400,
    message: "Order must include at least one dish",
  });
}


// Create a new order
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// Check that the orderId from the url and the body match
function bodyHasMatchingId(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (!id) return next();

  if (id === orderId) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
  });
}

// Check to see if an order already exists
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

// Validate a status that is being updated for allowed values
function validateStatus(req, res, next) {
  const order = res.locals.order;
  const { data: { status } = {} } = req.body;
  if (
    status === "pending" ||
    status === "preparing" ||
    status === "out-for-delivery" ||
    status === "delivered"
  ) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}

// Check to see if an order is pending
function orderPending(req, res, next) {
  const order = res.locals.order;
  if (order.status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending`,
  });
}

// Check to see if an order is already delivered
function orderAlreadyDelivered(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "delivered") {
    return next();
  }
  next({
    status: 400,
    message: `A delivered order cannot be changed`,
  });
}

// Read an order
function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

// Delete an order
function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  // splice returns an array of the deleted elements, even if it is one element
  const deletedOrders = orders.splice(index, 1);

  res.sendStatus(204);
}

module.exports = {
  create: [
    bodyHasDeliverToProperty,
    bodyHasMobileNumberProperty,
    bodyHasDishesProperty,
    dishesAreValid,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyHasMatchingId,
    orderAlreadyDelivered,
    validateStatus,
    bodyHasDeliverToProperty,
    bodyHasMobileNumberProperty,
    bodyHasDishesProperty,
    bodyHasStatusProperty,
    dishesAreValid,
    update,
  ],
  orderExists,
  list,
  delete: [orderExists, orderPending, destroy],
};
