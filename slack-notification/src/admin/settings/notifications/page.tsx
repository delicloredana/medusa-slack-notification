import type { SettingConfig } from "@medusajs/admin";
import {
  Slack,
  ArrowLeft,
  Plus,
  EllipsisHorizontal,
  Trash,
} from "@medusajs/icons";
import {
  Button,
  DropdownMenu,
  FocusModal,
  Heading,
  IconButton,
  Input,
  Label,
  Text,
  clx,
} from "@medusajs/ui";
import { useNavigate } from "react-router-dom";
import {
  useAdminCustomQuery,
  useAdminCustomPost,
  useAdminCustomDelete,
} from "medusa-react";
import React from "react";
import { SlackNotificationEvent } from "../../../models/slack-notification-event";

// const getKeys = (keys, object) => {
//   return keys.map((key) => {
//     if (typeof object[key] === "object") {
//       console.log(object[key])
//       return object[key]!==null && getKeys(Object.keys(object[key]), object[key]);
//     }
//     return (
//       <label>
//         {" "}
//         {key.toUpperCase()}
//         <input type="checkbox" name="" id="" />
//       </label>
//     );
//   });
// };

const NotificationsSettingPage = (props) => {
  const navigate = useNavigate();
  const { data, refetch } = useAdminCustomQuery("/slack/events", ["events"]);
  const [open, setOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<
    undefined | SlackNotificationEvent
  >(undefined);
  const [newEvent, setNewEvent] = React.useState(undefined);
  const { mutate } = useAdminCustomPost("/slack/events", ["events"]);
  const deleteEvent = useAdminCustomDelete(
    `/slack/events/${selectedEvent?.id || ""}`,
    [selectedEvent?.id]
  );
  React.useEffect(() => {
    if (data?.events?.length > 0) {
      setSelectedEvent(data.events[0]);
      console.log(data.events);
    }
  }, [data?.events]);

  return (
    <div>
      <button
        className="px-small py-xsmall mb-xsmall"
        onClick={() => navigate("/a/settings")}
      >
        <div className="gap-x-xsmall text-grey-50 inter-grey-40 inter-small-semibold flex items-center">
          <ArrowLeft /> <span className="ml-1">Back to Settings</span>
        </div>
      </button>
      <div className=" grid gap-base medium:grid grid-cols-3 ">
        <div className="bg-white border p-8 border-gray-200 rounded-lg">
          <div className=" flex justify-between">
            <h1 className="text-grey-90 inter-xlarge-semibold">Events</h1>
            <div className="flex items-center gap-x-2">
              <FocusModal open={open} onOpenChange={setOpen}>
                <FocusModal.Trigger asChild>
                  <IconButton variant="transparent">
                    <Plus />
                  </IconButton>
                </FocusModal.Trigger>
                <FocusModal.Content>
                  <FocusModal.Header>
                    <Button
                      onClick={() => {
                        mutate(
                          { event_name: newEvent },
                          {
                            onSuccess: async () => {
                              await refetch();
                              setOpen(false);
                            },
                          }
                        );
                      }}
                    >
                      Save
                    </Button>
                  </FocusModal.Header>
                  <FocusModal.Body className="flex flex-col items-center py-16">
                    <div className="flex w-full max-w-lg flex-col gap-y-8">
                      <div className="flex flex-col gap-y-1">
                        <Heading>Add new event</Heading>
                        <Text className="text-ui-fg-subtle">
                          Create new event to trigger slack notification. You
                          can create multiple events.
                        </Text>
                      </div>
                      <div className="flex flex-col gap-y-2">
                        <Label htmlFor="key_name" className="text-ui-fg-subtle">
                          Event name
                        </Label>
                        <Input
                          id="event_name"
                          placeholder="Enter event name"
                          onChange={(e) => {
                            setNewEvent(e.target.value);
                          }}
                        />
                      </div>
                    </div>
                  </FocusModal.Body>
                </FocusModal.Content>
              </FocusModal>
            </div>
          </div>
          <p className="text-grey-50 inter-base-regular mt-2xsmall">
            Manage events and content of slack notifications
          </p>
          <div className="mt-large">
            {data?.events?.length > 0 && selectedEvent && (
              <div
                className=" outline-none"
                role="radiogroup"
                aria-required="false"
                dir="ltr"
                tabIndex={0}
              >
                {data.events.map((event) => (
                  <label className="rounded-rounded border-grey-20 p-base mb-xsmall gap-base relative flex cursor-pointer items-start border">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={
                        selectedEvent.event_name === event.event_name
                          ? "true"
                          : "false"
                      }
                      slack-state={
                        selectedEvent.event_name === event.event_name
                          ? "checked"
                          : ""
                      }
                      className="radio-outer-ring outline-0 shadow-grey-20 rounded-circle h-[20px] w-[20px] shrink-0 shadow-[0_0_0_1px]"
                      tabIndex={-1}
                      onClick={() => setSelectedEvent(event)}
                    >
                      {selectedEvent.event_name === event.event_name && (
                        <span
                          slack-state={
                            selectedEvent.event_name === event.event_name
                              ? "checked"
                              : ""
                          }
                          className="indicator relative flex h-full w-full items-center justify-center after:bg-violet-60 after:rounded-circle after:absolute after:inset-0 after:m-auto after:block after:h-[12px] after:w-[12px]"
                        ></span>
                      )}
                      <span
                        slack-state={
                          selectedEvent.event_name === event.event_name
                            ? "checked"
                            : ""
                        }
                        aria-hidden="true"
                        className={clx(
                          " rounded-rounded absolute inset-0 ",
                          selectedEvent.event_name === event.event_name &&
                            "shadow-violet-60 shadow-[0_0_0_2px]"
                        )}
                      ></span>
                    </button>
                    <div className="truncate">
                      <div className="flex items-center">
                        <p className="inter-base-semibold truncate">
                          {event.event_name}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="bg-white border p-8 border-gray-200 rounded-lg col-span-2">
          {selectedEvent && (
            <div className="flex justify-between">
              <h1 className="text-grey-90 inter-xlarge-semibold">
                {selectedEvent.event_name}
              </h1>
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <EllipsisHorizontal />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item
                    className="gap-x-2 text-rose-500"
                    onClick={async () => {
                      deleteEvent.mutate(void {}, {
                        onSuccess: async () => await refetch(),
                      });
                    }}
                  >
                    <Trash color="#f43f5e" />
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            </div>
          )}
          <p className="text-grey-50 inter-base-regular mt-2xsmall">
            Choose message content
          </p>
          {/* <div>
              <form
                onSubmit={async () => {
                  mutate(
                    { slack: newMessage, event: selectedEvent },
                    {
                      onSuccess: async () => await refetch(),
                    }
                  );
                }}
              >
                {" "}
                <textarea
                  id="id"
                  defaultValue={slack.messages[selectedEvent]}
                  className=" w-full"
                  onChange={(e) => setNewMessage(e.target.value)}
                />{" "}
                <button type="submit">Submit</button>
              </form>
            </div> */}
          {/* <p>{slack.messages[selectedEvent]}</p> */}
          <div>
            <form>
              <div className="flex justify-between">
                {/* {Object.keys(data[selectedEvent]).map((key) => {
                    return (
                      <div>
                        <p>{key.split("_").join(" ").toUpperCase()}</p>
                        <div className=" grid grid-cols-1 gap-small">
                          {data[selectedEvent][key].map((k) => (
                            <label className="grid grid-cols-3">
                              <span className=" col-span-2">{k}</span> <input type="checkbox"  />
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })} */}
                {/* {  Object.keys(options[selectedEvent]).map(key=>)
                } */}

                {/* <input type="checkbox" name="" id="" />
                <input type="checkbox" name="" id="" /> */}
              </div>{" "}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export const config: SettingConfig = {
  card: {
    label: "Notifications",
    description: "Manage your slack notifications",
    icon: Slack,
  },
};

export default NotificationsSettingPage;
