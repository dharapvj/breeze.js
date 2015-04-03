(function (testFns) {

  if (testFns.DEBUG_SEQUELIZE || testFns.DEBUG_HIBERNATE) {
    module("query - raw odata",  {});
    skip("Skipping tests for Sequelize/Hibernate - these servers do no support OData syntax", function () {
      
    });
    return;
  };

  var breeze = testFns.breeze;
  var core = breeze.core;
  var MetadataStore = breeze.MetadataStore;
  var Enum = core.Enum;
  var EntityManager = breeze.EntityManager;
  var EntityQuery = breeze.EntityQuery;
  var EntityType = breeze.EntityType;

  var newEm = testFns.newEm;
  var testIfNot = testFns.testIfNot;

  module("query - raw odata", {
    setup: function () {
      testFns.setup();
    },
    teardown: function () {

    }
  });

  //// for now returns an OData message "$count is not supported"
  //test("$count operator", function () {
  //    
  //    var em = newEm(testFns.newMs());
  //    ok(em, "no em found");

  //    var query = "Customers?$filter=startswith(CompanyName, 'A') eq true&$count";
  //    em.executeQuery(query).then(function (data) {
  //        ok(!em.metadataStore.isEmpty(), "metadata should not be empty");
  //        ok(data, "no data");

  //    }).fail(testFns.handleFail).fin(done);
  //});

  testIfNot("filter and order by",
    "mongo", "does not support 'expand'", function (assert) {
      var done = assert.async();
    
    var em = newEm(testFns.newMs());
    ok(em, "no em found");

    var query = "Customers?$filter=startswith(CompanyName, 'A') eq true&$orderby=CompanyName desc&$expand=Orders";
    em.executeQuery(query).then(function (data) {
      ok(!em.metadataStore.isEmpty(), "metadata should not be empty");
      ok(data, "no data");
      ok(data.results.length > 0, "empty data");
      var customers = data.results;
      customers.forEach(function (c) {
        ok(c.getProperty("companyName"), "missing companyName property");
        var key = c.entityAspect.getKey();
        ok(key, "missing key");
      });
    }).fail(testFns.handleFail).fin(done);
  });

  testIfNot("select",
    "mongo", "does not support 'expand'", function (assert) {
      var done = assert.async();
    var em = newEm(testFns.newMs());
    ok(em, "no em found");

    var query = "Customers?$filter=startswith(CompanyName, 'A') eq true&$select=CompanyName, Orders";
    if (testFns.DEBUG_ODATA) {
      query = query + "&$expand=Orders";
    }
    
    em.executeQuery(query).then(function (data) {
      ok(!em.metadataStore.isEmpty(), "metadata should not be empty");
      var orderType = em.metadataStore.getEntityType("Order");
      ok(data, "no data");
      ok(data.results.length > 0, "empty data");
      var anons = data.results;
      anons.forEach(function (a) {
        ok(a.companyName);
        ok(Array.isArray(a.orders));
        a.orders.forEach(function (order) {
          ok(order.entityType === orderType);
        });
      });
    }).fail(testFns.handleFail).fin(done);
  });

  test("bad expr", function (assert) {
    var done = assert.async();

    var em = newEm();
    var query = "Customers?$filter=starxtswith(CompanyName, 'A') eq true&$orderby=CompanyName desc";

    em.executeQuery(query).fail(function (error) {
      ok(error instanceof Error, "should be an error");
      ok(error.message.indexOf("starxtswith") > -1, "error message has wrong text");
    }).fail(testFns.handleFail).fin(done);
  });

  testIfNot("raw ajax to web api - server side include many - customer and orders", 
    "mongo,odata", "does not implement the 'CustomersAndOrders' endpoint'", function (assert) {
      var done = assert.async();
    
    try {
      $.getJSON(testFns.defaultServiceName + "/CustomersAndOrders?&$top=3").success(function (data, status) {
        ok(data);
        var str = JSON.stringify(data, undefined, 4);
        testFns.output("Customers with orders");
        testFns.output(str);
        start();
      }).error(function (e) {
        testFns.handleFail(e);
      });
    } catch (e) {
      testFns.handleFail(e);
    }
  });


})(breezeTestFns);